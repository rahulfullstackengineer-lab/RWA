import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    let orgId = searchParams.get('orgId') || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || null
    }
    if (!orgId) {
      return NextResponse.json({ error: 'No society organization selected' }, { status: 400 })
    }

    const status = searchParams.get('status') || undefined
    const recurring = searchParams.get('recurring')
    const isRecurringFilter = recurring === 'true' ? true : (recurring === 'false' ? false : undefined)

    const expenses = await prisma.expense.findMany({
      where: {
        organizationId: orgId,
        ...(status ? { status } : {}),
        ...(isRecurringFilter !== undefined ? { isRecurring: isRecurringFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ expenses })
  } catch (err: unknown) {
    console.error('Expenses GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      title,
      amount,
      category = 'Maintenance',
      vendorName = 'General Vendor',
      description,
      isRecurring = false,
      recurringDay = 1,
      recurringMonth = null,
    } = body

    if (!title || !amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 })
    }

    const orgId = user.organizationId!
    const numAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0

    const expense = await prisma.expense.create({
      data: {
        organizationId: orgId,
        title: title.trim(),
        amount: numAmount,
        totalAmount: numAmount,
        category,
        vendorName: vendorName.trim(),
        description: description?.trim() || null,
        status: 'PENDING_APPROVAL',
        createdBy: user.name,
        isRecurring: Boolean(isRecurring),
        recurringDay: Number(recurringDay) || 1,
        recurringMonth: recurringMonth || null,
      },
    })

    // Emit live socket event
    emitLiveSocketEvent('new-expense-recorded', {
      id: expense.id,
      title: expense.title,
      amount: expense.totalAmount,
      category: expense.category,
      vendorName: expense.vendorName,
      status: expense.status,
    }, { orgId })

    // Log Immutable Audit Trail Event
    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'EXPENSE_RECORDED',
      entityType: 'Expense',
      entityId: expense.id,
      details: `Expense voucher recorded for ₹${expense.totalAmount.toLocaleString('en-IN')}: "${expense.title}" (${expense.category}) to ${expense.vendorName}`,
      severity: 'INFO',
      newValues: {
        expenseId: expense.id,
        amount: expense.totalAmount,
        category: expense.category,
        vendorName: expense.vendorName,
        title: expense.title,
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, expense })
  } catch (err: unknown) {
    console.error('Expenses POST error:', err)
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Expense ID and status are required' }, { status: 400 })
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        status,
        approvedBy: status === 'APPROVED' ? (user.name || 'Admin') : (status === 'REJECTED' ? null : undefined),
        paidDate: status === 'PAID' ? new Date() : undefined,
        notes: body.reason || body.notes || undefined,
      },
    })

    const targetOrgId = user.organizationId || updated.organizationId
    if (targetOrgId) {
      emitLiveSocketEvent('expense-status-updated', {
        id: updated.id,
        title: updated.title,
        status: updated.status,
      }, { orgId: targetOrgId })
    }

    // Audit log
    await logAudit({
      organizationId: updated.organizationId,
      userId: user.id,
      action: status === 'APPROVED' ? 'EXPENSE_APPROVED' : (status === 'REJECTED' ? 'EXPENSE_REJECTED' : 'EXPENSE_UPDATED'),
      entityType: 'Expense',
      entityId: updated.id,
      details: `Expense voucher "${updated.title}" marked as ${status} by ${user.name || 'Admin'}`,
      severity: 'INFO',
      newValues: { status: updated.status, approvedBy: updated.approvedBy },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    }).catch(() => {})

    return NextResponse.json({ success: true, expense: updated })
  } catch (err: unknown) {
    console.error('Expenses PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update expense: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}

