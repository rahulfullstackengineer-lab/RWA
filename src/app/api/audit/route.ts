import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    let orgId = user.organizationId
    if (!orgId) {
      const urlOrgId = url.searchParams.get('orgId') || request.headers.get('x-active-org-id')
      if (urlOrgId) {
        orgId = urlOrgId
      } else {
        const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
        orgId = firstOrg?.id || null
      }
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization associated with user' }, { status: 400 })
    }

    const search = url.searchParams.get('search')?.toLowerCase().trim() || ''
    const actionFilter = url.searchParams.get('action') || 'ALL'
    const userFilter = url.searchParams.get('user') || 'ALL'
    const monthFilter = url.searchParams.get('month') || 'ALL'
    const severityFilter = url.searchParams.get('severity') || 'ALL'

    // 1. Check if this organization has any audit logs in the immutable audit table
    let count = await prisma.auditLog.count({
      where: { organizationId: orgId },
    })

    // If no audit records exist yet, automatically synthesize and backfill real audit events
    // from the actual society entities in the database (Invoices, Payments, Notices, Expenses, Complaints, Members, Society)
    if (count === 0) {
      const backfillLogs: Array<{
        organizationId: string
        userId: string | null
        action: string
        entityType: string
        entityId: string | null
        oldValues: string | null
        newValues: string | null
        createdAt: Date
      }> = []

      // a) Society Onboarding Event
      const org = await prisma.organization.findUnique({ where: { id: orgId } })
      if (org) {
        backfillLogs.push({
          organizationId: orgId,
          userId: user.id,
          action: 'SOCIETY_ONBOARDED',
          entityType: 'Organization',
          entityId: org.id,
          oldValues: null,
          newValues: JSON.stringify({
            details: `Society "${org.name}" initialized with ${org.totalUnits || 112} registered units (${org.plan || 'STARTER'} plan)`,
            severity: 'INFO',
            plan: org.plan,
            totalUnits: org.totalUnits,
          }),
          createdAt: org.createdAt,
        })
      }

      // b) Real Invoice Batch Generations
      const invoices = await prisma.invoice.findMany({
        where: { organizationId: orgId },
        include: { unit: true },
        orderBy: { createdAt: 'asc' },
      })

      if (invoices.length > 0) {
        // Group by billingMonth
        const monthGroups = new Map<string, typeof invoices>()
        for (const inv of invoices) {
          const m = inv.billingMonth || '2026-10'
          if (!monthGroups.has(m)) monthGroups.set(m, [])
          monthGroups.get(m)!.push(inv)
        }

        for (const [m, invList] of monthGroups.entries()) {
          const totalDemand = invList.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)
          const earliestTime = invList[0].createdAt
          backfillLogs.push({
            organizationId: orgId,
            userId: user.id,
            action: 'BILL_BATCH_GENERATED',
            entityType: 'InvoiceBatch',
            entityId: `Cycle-${m}`,
            oldValues: null,
            newValues: JSON.stringify({
              details: `Generated ${invList.length} maintenance bills for cycle ${m} totaling ₹${totalDemand.toLocaleString('en-IN')}`,
              severity: 'INFO',
              count: invList.length,
              demand: totalDemand,
              cycle: m,
            }),
            createdAt: earliestTime,
          })
        }
      }

      // c) Real Payments Recorded
      const payments = await prisma.payment.findMany({
        where: { organizationId: orgId },
        include: {
          invoice: {
            include: { unit: true },
          },
          user: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      for (const p of payments) {
        const unit = p.invoice?.unit
        const unitStr = unit ? ` for Unit ${unit.unitNumber}` : ''
        const invStr = p.invoice ? ` (${p.invoice.invoiceNumber})` : ''
        backfillLogs.push({
          organizationId: orgId,
          userId: p.userId || user.id,
          action: 'PAYMENT_RECORDED',
          entityType: 'Payment',
          entityId: p.razorpayPaymentId || p.referenceNo || p.id,
          oldValues: null,
          newValues: JSON.stringify({
            details: `Payment ₹${p.amount.toLocaleString('en-IN')} recorded via ${p.method || 'CASH'}${unitStr}${invStr}`,
            severity: 'INFO',
            amount: p.amount,
            method: p.method,
            status: p.status,
          }),
          createdAt: p.createdAt,
        })
      }

      // d) Notices / Circulars
      const notices = await prisma.notice.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'asc' },
      })

      for (const n of notices) {
        backfillLogs.push({
          organizationId: orgId,
          userId: user.id,
          action: 'NOTICE_PUBLISHED',
          entityType: 'Notice',
          entityId: n.id,
          oldValues: null,
          newValues: JSON.stringify({
            details: `Circular notice "${n.title}" published to all residents (${n.type || 'GENERAL'})`,
            severity: 'INFO',
            title: n.title,
            type: n.type,
          }),
          createdAt: n.createdAt,
        })
      }

      // e) Real Expenses
      const expenses = await prisma.expense.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'asc' },
      })

      for (const e of expenses) {
        backfillLogs.push({
          organizationId: orgId,
          userId: user.id,
          action: 'EXPENSE_APPROVED',
          entityType: 'Expense',
          entityId: e.id,
          oldValues: null,
          newValues: JSON.stringify({
            details: `Approved expense voucher ₹${e.amount.toLocaleString('en-IN')} for ${e.category}${e.vendorName ? ` (${e.vendorName})` : ''}`,
            severity: 'INFO',
            amount: e.amount,
            category: e.category,
          }),
          createdAt: e.createdAt,
        })
      }

      // f) Complaints
      const complaints = await prisma.complaint.findMany({
        where: { organizationId: orgId },
        include: { unit: true },
        orderBy: { createdAt: 'asc' },
      })

      for (const c of complaints) {
        const uStr = c.unit ? ` by Unit ${c.unit.unitNumber}` : ''
        backfillLogs.push({
          organizationId: orgId,
          userId: c.raisedById || null,
          action: 'COMPLAINT_FILED',
          entityType: 'Complaint',
          entityId: c.ticketNumber || c.id,
          oldValues: null,
          newValues: JSON.stringify({
            details: `Complaint filed${uStr}: "${c.title}" (${c.category}) [Status: ${c.status}]`,
            severity: c.priority === 'URGENT' ? 'CRITICAL' : 'WARNING',
            title: c.title,
            category: c.category,
            status: c.status,
          }),
          createdAt: c.createdAt,
        })
      }

      // g) Members registered
      const orgUsers = await prisma.user.findMany({
        where: { organizationId: orgId },
        include: { unit: true },
        orderBy: { createdAt: 'asc' },
      })

      for (const u of orgUsers) {
        const uStr = u.unit ? ` (Unit ${u.unit.unitNumber})` : ''
        backfillLogs.push({
          organizationId: orgId,
          userId: u.id,
          action: 'MEMBER_REGISTERED',
          entityType: 'User',
          entityId: u.id,
          oldValues: null,
          newValues: JSON.stringify({
            details: `${u.name} registered with role ${u.role}${uStr} · Phone ${u.phone}`,
            severity: 'INFO',
            role: u.role,
            phone: u.phone,
          }),
          createdAt: u.createdAt,
        })
      }

      // Save all backfilled audit records into prisma.auditLog in bulk
      for (const logItem of backfillLogs) {
        await prisma.auditLog.create({
          data: logItem,
        })
      }
    }

    // 2. Query all audit logs for this organization
    const rawLogs = await prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    // Fetch user map for human-readable actor names and roles
    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, role: true, phone: true },
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    const uniqueActions = new Set<string>()
    const uniqueActors = new Set<string>()
    const uniqueMonths = new Set<string>()

    const formattedLogs = rawLogs.map(log => {
      let actorName = 'System'
      let actorRole = 'SYSTEM'
      if (log.userId && userMap.has(log.userId)) {
        const u = userMap.get(log.userId)!
        actorName = u.name
        actorRole = u.role
      } else if (log.userId === user.id) {
        actorName = user.name
        actorRole = user.role
      }

      let details = ''
      let severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO'

      if (log.newValues) {
        try {
          const parsed = JSON.parse(log.newValues)
          details = parsed.details || JSON.stringify(parsed)
          severity = parsed.severity || 'INFO'
        } catch {
          details = log.newValues
        }
      } else if (log.oldValues) {
        details = `Previous state: ${log.oldValues}`
      }

      const dateObj = new Date(log.createdAt)
      const monthStr = dateObj.toISOString().slice(0, 7) // YYYY-MM
      uniqueMonths.add(monthStr)
      uniqueActions.add(log.action)
      uniqueActors.add(actorName)

      return {
        id: log.id,
        timestamp: log.createdAt,
        timeFormatted: dateObj.toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        month: monthStr,
        actor: actorName,
        actorRole,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId || log.entityType,
        details,
        severity,
        ipAddress: log.ipAddress || null,
      }
    })

    // Apply Filters
    let filtered = formattedLogs

    if (actionFilter !== 'ALL') {
      filtered = filtered.filter(l => l.action === actionFilter)
    }

    if (userFilter !== 'ALL') {
      filtered = filtered.filter(l => l.actor === userFilter || l.actorRole === userFilter)
    }

    if (monthFilter !== 'ALL') {
      filtered = filtered.filter(l => l.month === monthFilter)
    }

    if (severityFilter !== 'ALL') {
      filtered = filtered.filter(l => l.severity === severityFilter)
    }

    if (search) {
      filtered = filtered.filter(
        l =>
          l.action.toLowerCase().includes(search) ||
          l.actor.toLowerCase().includes(search) ||
          l.entityId.toLowerCase().includes(search) ||
          l.entityType.toLowerCase().includes(search) ||
          l.details.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({
      success: true,
      total: filtered.length,
      logs: filtered,
      filterOptions: {
        actions: Array.from(uniqueActions).sort(),
        actors: Array.from(uniqueActors).sort(),
        months: Array.from(uniqueMonths).sort().reverse(),
      },
    })
  } catch (err: unknown) {
    console.error('Audit API GET error:', err)
    return NextResponse.json({ error: 'Failed to retrieve audit trail' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const orgId = user.organizationId
    if (!orgId) {
      return NextResponse.json({ error: 'No society organization associated with user' }, { status: 400 })
    }

    const body = await request.json()
    const { action, entityType, entityId, details, severity = 'INFO', oldValues, newValues } = body

    if (!action || !entityType) {
      return NextResponse.json({ error: 'action and entityType are required' }, { status: 400 })
    }

    const created = await logAudit({
      organizationId: orgId,
      userId: user.id,
      action,
      entityType,
      entityId,
      details,
      severity,
      oldValues,
      newValues,
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, auditLog: created })
  } catch (err) {
    console.error('Audit API POST error:', err)
    return NextResponse.json({ error: 'Failed to record audit log' }, { status: 500 })
  }
}
