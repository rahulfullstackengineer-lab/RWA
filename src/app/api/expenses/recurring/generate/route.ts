import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'

// Helper to format Month (e.g. '2026-11' -> 'Nov 2026')
function formatMonthName(mStr: string) {
  try {
    const [y, m] = mStr.split('-').map(Number)
    const date = new Date(y, m - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return mStr
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const orgId = request.headers.get('x-active-org-id') || searchParams.get('orgId') || user.organizationId!
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7) // 'YYYY-MM'

    // Fetch recurring templates (items marked as recurring where templateId is null or original master)
    const templates = await prisma.expense.findMany({
      where: {
        organizationId: orgId,
        isRecurring: true,
        templateId: null,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch vouchers already generated for this month
    const generatedThisMonth = await prisma.expense.findMany({
      where: {
        organizationId: orgId,
        recurringMonth: month,
      },
      select: {
        id: true,
        title: true,
        templateId: true,
        status: true,
        amount: true,
        createdAt: true,
      },
    })

    const generatedTemplateIdSet = new Set(
      generatedThisMonth.map((g) => g.templateId).filter(Boolean)
    )

    const templateStatusList = templates.map((t) => ({
      id: t.id,
      title: t.title,
      vendorName: t.vendorName,
      category: t.category,
      amount: t.amount,
      recurringDay: t.recurringDay || 1,
      alreadyGenerated: generatedTemplateIdSet.has(t.id),
    }))

    const totalRecurringAmount = templates.reduce((s, t) => s + t.amount, 0)
    const pendingToGenerate = templateStatusList.filter((t) => !t.alreadyGenerated)

    return NextResponse.json({
      month,
      monthFormatted: formatMonthName(month),
      templates: templateStatusList,
      totalTemplates: templates.length,
      totalRecurringAmount,
      pendingCount: pendingToGenerate.length,
      alreadyGeneratedCount: generatedThisMonth.length,
    })
  } catch (err: unknown) {
    console.error('Recurring templates GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch recurring expense templates: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const orgId = body.orgId || request.headers.get('x-active-org-id') || user.organizationId!
    const month = body.month || new Date().toISOString().slice(0, 7) // 'YYYY-MM'
    const selectedTemplateIds: string[] | undefined = body.templateIds

    // Fetch recurring master templates
    const templates = await prisma.expense.findMany({
      where: {
        organizationId: orgId,
        isRecurring: true,
        templateId: null,
        ...(selectedTemplateIds && selectedTemplateIds.length > 0
          ? { id: { in: selectedTemplateIds } }
          : {}),
      },
    })

    if (templates.length === 0) {
      return NextResponse.json({
        error: 'No recurring templates found to generate. Please mark an expense as Recurring first.',
      }, { status: 400 })
    }

    // Check which ones are already generated for this month to avoid duplicates
    const alreadyGenerated = await prisma.expense.findMany({
      where: {
        organizationId: orgId,
        recurringMonth: month,
      },
      select: { templateId: true },
    })
    const generatedSet = new Set(alreadyGenerated.map((g) => g.templateId).filter(Boolean))

    const monthFormatted = formatMonthName(month)
    const toCreate = templates.filter((t) => !generatedSet.has(t.id))

    if (toCreate.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: `All recurring expenses for ${monthFormatted} have already been generated.`,
        expenses: [],
      })
    }

    const createdList = []
    for (const t of toCreate) {
      const day = t.recurringDay || 1
      const [year, mon] = month.split('-').map(Number)
      const expenseDate = new Date(year, mon - 1, Math.min(day, 28))

      const newExpense = await prisma.expense.create({
        data: {
          organizationId: orgId,
          title: `${t.title} (${monthFormatted})`,
          amount: t.amount,
          totalAmount: t.totalAmount,
          category: t.category,
          vendorName: t.vendorName,
          vendorPhone: t.vendorPhone,
          description: `Recurring monthly commitment for ${monthFormatted} (Scheduled on day ${day} of every month).`,
          status: 'PENDING_APPROVAL',
          isRecurring: true,
          recurringDay: day,
          recurringMonth: month,
          templateId: t.id,
          billDate: expenseDate,
          createdBy: user.name || 'System Auto-Scheduler',
        },
      })

      createdList.push(newExpense)

      emitLiveSocketEvent('new-expense-recorded', {
        id: newExpense.id,
        title: newExpense.title,
        amount: newExpense.totalAmount,
        category: newExpense.category,
        vendorName: newExpense.vendorName,
        status: newExpense.status,
      }, { orgId })
    }

    // Log Audit Trail
    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'EXPENSES_BATCH_GENERATED',
      entityType: 'Expense',
      details: `Generated ${createdList.length} recurring monthly expense vouchers for ${monthFormatted} totaling ₹${createdList.reduce((s, e) => s + e.totalAmount, 0).toLocaleString('en-IN')}`,
      severity: 'INFO',
      newValues: { month, count: createdList.length },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      count: createdList.length,
      month,
      monthFormatted,
      expenses: createdList,
    })
  } catch (err: unknown) {
    console.error('Recurring batch generate error:', err)
    return NextResponse.json({ error: 'Failed to generate recurring expenses: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}
