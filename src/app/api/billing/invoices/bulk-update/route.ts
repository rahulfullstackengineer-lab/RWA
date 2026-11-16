import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

function money(n: number) {
  return Number(n || 0).toLocaleString('en-IN')
}

function labelMonth(month: string | null | undefined) {
  if (!month) return 'this'
  const [year, mon] = String(month).split('-')
  const date = new Date(Number(year), Number(mon) - 1, 1)
  if (Number.isNaN(date.getTime())) return String(month)
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function readRevision(notes: string | null | undefined) {
  if (!notes) return null
  try {
    const parsed = JSON.parse(notes) as { revision?: { excess?: number; previousAmount?: number; balance?: number; updatedByName?: string; outcome?: string; residentMessage?: string } }
    return parsed.revision || null
  } catch {
    return null
  }
}

async function applyRevisedTotal(
  inv: {
    id: string
    unitId: string
    billingMonth: string
    totalAmount: number
    paidAmount: number
    status: string
    notes: string | null
    unit?: { unitNumber?: string | null } | null
  },
  revisedTotal: number,
  reason: string,
  updatedByName: string,
  options?: { keepItems?: boolean; adjustmentLine?: { description: string; amount: number } }
) {
  const paid = inv.paidAmount || 0
  const previousAmount = inv.totalAmount || 0
  const balance = Math.max(0, Math.round((revisedTotal - paid) * 100) / 100)
  const excess = Math.max(0, Math.round((paid - revisedTotal) * 100) / 100)
  const outcome = excess > 0.5 ? 'REFUND_AT_OFFICE' : balance > 0.5 && paid > 0.5 ? 'PAY_REMAINING' : balance <= 0.5 ? 'SETTLED' : 'REVISED'
  const status = balance <= 0.5 ? 'PAID' : paid > 0.5 ? 'PARTIALLY_PAID' : inv.status === 'OVERDUE' ? 'OVERDUE' : 'ISSUED'
  const monthLabel = labelMonth(inv.billingMonth)
  const residentMessage = outcome === 'REFUND_AT_OFFICE'
    ? `Your ${monthLabel} bill was revised from ₹${money(previousAmount)} to ₹${money(revisedTotal)} by ${updatedByName}. You already paid ₹${money(paid)}, which is ₹${money(excess)} more than the revised bill. This app does not refund that amount. The society office can return ₹${money(excess)} when you visit.`
    : outcome === 'PAY_REMAINING'
      ? `Your ${monthLabel} bill was revised from ₹${money(previousAmount)} to ₹${money(revisedTotal)} by ${updatedByName}. You have paid ₹${money(paid)}. ₹${money(balance)} is still due and can be paid online in the resident portal.`
      : `Your ${monthLabel} bill was revised from ₹${money(previousAmount)} to ₹${money(revisedTotal)} by ${updatedByName}. Reason: ${reason}.`
  const notes = JSON.stringify({
    revision: {
      previousAmount,
      newAmount: revisedTotal,
      paidAmount: paid,
      excess,
      balance,
      reason,
      updatedByName,
      updatedAt: new Date().toISOString(),
      outcome,
      residentMessage,
    },
  })

  if (!options?.keepItems) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: inv.id } })
  }
  await prisma.invoice.update({
    where: { id: inv.id },
    data: {
      totalAmount: revisedTotal,
      balanceAmount: balance,
      status,
      notes,
      ...(options?.keepItems
        ? {}
        : {
            items: {
              create: [{
                description: reason || 'Revised monthly maintenance',
                amount: revisedTotal,
                gstPercent: 0,
                gstAmount: 0,
                totalAmount: revisedTotal,
              }],
            },
          }),
    },
  })
  if (options?.adjustmentLine) {
    await prisma.invoiceItem.create({
      data: {
        invoiceId: inv.id,
        description: options.adjustmentLine.description,
        amount: options.adjustmentLine.amount,
        gstPercent: 0,
        gstAmount: 0,
        totalAmount: options.adjustmentLine.amount,
      },
    })
  }
  inv.notes = notes
  inv.totalAmount = revisedTotal
  return {
    excess,
    balance,
    summary: {
      invoiceId: inv.id,
      unitNumber: inv.unit?.unitNumber || 'Flat',
      paidAmount: paid,
      previousAmount,
      revisedTotal,
      excess,
    },
    notice: {
      invoiceId: inv.id,
      unitId: inv.unitId,
      billingMonth: inv.billingMonth,
      balance,
      message: residentMessage,
    },
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const {
      billingMonth,
      action = 'SET_AMOUNT',
      newAmount,
      adjustmentAmount,
      adjustmentReason = 'Bulk Billing Revision',
      newDueDate,
      invoiceIds = [],
    } = body

    const orgId = user.organizationId

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization selected' }, { status: 400 })
    }

    if (action === 'NOTIFY_OFFICE_REFUND') {
      const ids = Array.isArray(invoiceIds) ? invoiceIds.filter(Boolean) : []
      if (!ids.length) {
        return NextResponse.json({ error: 'Choose the bills that were paid above the revised amount' }, { status: 400 })
      }
      const targets = await prisma.invoice.findMany({
        where: { id: { in: ids }, organizationId: orgId },
        include: { unit: true },
      })
      let notified = 0
      for (const inv of targets) {
        const rev = readRevision(inv.notes)
        const excess = rev?.excess || Math.max(0, (inv.paidAmount || 0) - (inv.totalAmount || 0))
        if (excess <= 0.5) continue
        const people = await prisma.user.findMany({
          where: { organizationId: orgId, unitId: inv.unitId },
          select: { id: true },
        })
        const message = `Your ${labelMonth(inv.billingMonth)} bill was revised from ₹${money(rev?.previousAmount ?? inv.totalAmount)} to ₹${money(inv.totalAmount)} by ${rev?.updatedByName || user.name}. You paid ₹${money(inv.paidAmount)}, which is ₹${money(excess)} more than the revised bill. This app does not refund money. Please visit the RWA office to collect ₹${money(excess)}.`
        if (people.length) {
          await prisma.notification.createMany({
            data: people.map((person) => ({
              organizationId: orgId,
              userId: person.id,
              title: `Collect ₹${money(excess)} at the RWA office`,
              message,
              type: 'BILL',
              referenceType: 'INVOICE',
              referenceId: inv.id,
            })),
          })
          const io = (global as { __io?: { to: (room: string) => { emit: (event: string, payload: unknown) => void } } }).__io
          for (const person of people) {
            io?.to(`user:${person.id}`).emit('bill-updated', {
              billingMonth: inv.billingMonth,
              message,
              outcome: 'REFUND_AT_OFFICE',
            })
          }
          notified += people.length
        }
      }
      return NextResponse.json({
        success: true,
        message: notified
          ? `Office collection notice sent to ${notified} resident${notified === 1 ? '' : 's'}`
          : 'No resident account was linked to those flats',
        notified,
      })
    }

    if (action === 'MARK_REFUND_COLLECTED') {
      const ids = Array.isArray(invoiceIds) ? invoiceIds.filter(Boolean) : []
      if (!ids.length) {
        return NextResponse.json({ error: 'Choose the bill whose extra amount was collected' }, { status: 400 })
      }
      const collectionNote = String(body.collectionNote || '').trim()
      const targets = await prisma.invoice.findMany({
        where: { id: { in: ids }, organizationId: orgId },
        include: { unit: true },
      })
      const collectedAt = new Date()
      const collected: { invoiceId: string; unitNumber: string; amount: number }[] = []
      for (const inv of targets) {
        let parsed: { revision?: Record<string, unknown> } = {}
        try { parsed = inv.notes ? JSON.parse(inv.notes) : {} } catch { parsed = {} }
        const rev = (parsed.revision || readRevision(inv.notes) || {}) as {
          excess?: number
          outcome?: string
          residentMessage?: string
        }
        const excess = Number(rev.excess || Math.max(0, (inv.paidAmount || 0) - (inv.totalAmount || 0)))
        if (rev.outcome === 'REFUND_COLLECTED' || excess <= 0.5) continue
        const when = collectedAt.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        const collectedLine = `The extra ₹${money(excess)} was collected at the RWA office on ${when}, recorded by ${user.name}.${collectionNote ? ` Note: ${collectionNote}` : ''}`
        const residentMessage = rev.residentMessage
          ? `${rev.residentMessage} ${collectedLine}`
          : `Your ${labelMonth(inv.billingMonth)} bill was revised. ${collectedLine}`
        parsed.revision = {
          ...rev,
          excess,
          outcome: 'REFUND_COLLECTED',
          refundCollectedAt: collectedAt.toISOString(),
          refundCollectedByName: user.name,
          refundCollectedAmount: excess,
          collectionNote: collectionNote || null,
          residentMessage,
        }
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { notes: JSON.stringify(parsed) },
        })
        const people = await prisma.user.findMany({
          where: { organizationId: orgId, unitId: inv.unitId },
          select: { id: true },
        })
        if (people.length) {
          await prisma.notification.createMany({
            data: people.map((person) => ({
              organizationId: orgId,
              userId: person.id,
              title: `₹${money(excess)} collected at the office`,
              message: residentMessage,
              type: 'BILL',
              referenceType: 'INVOICE',
              referenceId: inv.id,
            })),
          })
        }
        collected.push({
          invoiceId: inv.id,
          unitNumber: inv.unit?.unitNumber || 'Flat',
          amount: excess,
        })
      }
      if (!collected.length) {
        return NextResponse.json({ error: 'Those bills have no office refund waiting to be marked collected' }, { status: 400 })
      }
      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'OFFICE_REFUND_COLLECTED',
        entityType: 'Invoice',
        entityId: collected.map((row) => row.invoiceId).join(','),
        details: `${user.name} recorded office collection of ${collected.map((row) => `₹${money(row.amount)} for Flat ${row.unitNumber}`).join('; ')}`,
        severity: 'INFO',
        newValues: { collected, collectionNote },
        ipAddress: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
      })
      return NextResponse.json({
        success: true,
        message: collected.length === 1
          ? `Flat ${collected[0].unitNumber} is marked as having collected ₹${money(collected[0].amount)} at the office`
          : `${collected.length} office refunds marked as collected`,
        collected,
      })
    }

    // Amount changes include bills that are already paid. Due-date changes stay on open bills.
    const changesAmount = action === 'SET_AMOUNT' || action === 'APPLY_ADJUSTMENT'
    const filter: Record<string, unknown> = {
      organizationId: orgId,
      ...(changesAmount ? {} : { status: { not: 'PAID' } }),
    }

    if (Array.isArray(invoiceIds) && invoiceIds.length > 0) {
      filter.id = { in: invoiceIds }
    } else if (billingMonth && billingMonth !== 'ALL') {
      filter.billingMonth = billingMonth
    }

    const invoices = await prisma.invoice.findMany({
      where: filter,
      include: {
        unit: true,
        items: true,
      },
    })

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: 'No invoices found for that selection' },
        { status: 404 }
      )
    }

    let updatedCount = 0
    let totalRevisedDemand = 0
    const overpaid: Array<{ invoiceId: string; unitNumber: string; paidAmount: number; previousAmount: number; revisedTotal: number; excess: number }> = []
    const payRemaining: Array<{ invoiceId: string; unitId: string; billingMonth: string; balance: number; message: string }> = []

    if (action === 'DELETE_UNPAID') {
      const idsToDelete = invoices.map((inv) => inv.id)
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: { in: idsToDelete } },
      })
      const deleteResult = await prisma.invoice.deleteMany({
        where: { id: { in: idsToDelete } },
      })
      updatedCount = deleteResult.count

      // Socket.io emit
      const io = (global as any).__io
      if (io) {
        io.to(`org:${orgId}`).emit('bills-updated-bulk', {
          organizationId: orgId,
          billingMonth,
          action: 'DELETE_UNPAID',
          updatedCount,
          timestamp: new Date().toISOString(),
        })
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${updatedCount} unpaid invoices`,
        updatedCount,
      })
    }

    // Execute bulk update across matching invoices
    for (const inv of invoices) {
      if (action === 'SET_AMOUNT' && newAmount !== undefined) {
        const revisedTotal = Number(newAmount)
        const outcome = await applyRevisedTotal(inv, revisedTotal, adjustmentReason || 'Revised monthly maintenance', user.name)
        if (outcome.excess > 0.5) overpaid.push(outcome.summary)
        if (outcome.balance > 0.5 && (inv.paidAmount || 0) > 0.5) payRemaining.push(outcome.notice)
        totalRevisedDemand += revisedTotal
        updatedCount++
      } else if (action === 'APPLY_ADJUSTMENT' && adjustmentAmount !== undefined) {
        const adj = Number(adjustmentAmount)
        const revisedTotal = Math.max(0, inv.totalAmount + adj)
        const outcome = await applyRevisedTotal(inv, revisedTotal, adjustmentReason || 'Bill adjustment', user.name, {
          keepItems: true,
          adjustmentLine: {
            description: `Adjustment: ${adjustmentReason} (${adj >= 0 ? '+' : '-'}₹${Math.abs(adj).toLocaleString('en-IN')})`,
            amount: adj,
          },
        })
        if (outcome.excess > 0.5) overpaid.push(outcome.summary)
        if (outcome.balance > 0.5 && (inv.paidAmount || 0) > 0.5) payRemaining.push(outcome.notice)
        totalRevisedDemand += revisedTotal
        updatedCount++
      } else if (action === 'UPDATE_DUE_DATE' && newDueDate) {
        const d = new Date(newDueDate)
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { dueDate: d },
        })
        updatedCount++
      }
    }

    // Create database notifications for residents
    const unitIds = invoices.map((inv) => inv.unitId).filter(Boolean)
    const affectedUsers = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        unitId: { in: unitIds },
      },
    })

    const notifData = affectedUsers.flatMap((u) => {
      const inv = invoices.find((i) => i.unitId === u.unitId)
      const rev = readRevision(inv?.notes)
      if (rev?.outcome === 'REFUND_AT_OFFICE') return []
      const message = rev?.residentMessage
        || (action === 'UPDATE_DUE_DATE'
          ? `The payment due date for your ${labelMonth(billingMonth)} bill was updated by ${user.name}.`
          : `Your maintenance bill was revised by ${user.name}.`)
      const title = rev?.outcome === 'PAY_REMAINING'
        ? `₹${money(rev.balance || 0)} still due on your revised bill`
        : `Bill revised for ${labelMonth(inv?.billingMonth || billingMonth)}`
      return [{
        organizationId: orgId,
        userId: u.id,
        title,
        message,
        type: 'BILL',
        referenceType: 'INVOICE',
        referenceId: inv ? inv.id : null,
      }]
    })

    if (notifData.length > 0) {
      try {
        await prisma.notification.createMany({ data: notifData })
      } catch (err) {
        console.warn('Failed to insert bulk update notifications:', err)
      }
    }

    // Socket.io dispatch
    const io = (global as any).__io
    if (io) {
      io.to(`org:${orgId}`).emit('bills-updated-bulk', {
        organizationId: orgId,
        billingMonth,
        updatedCount,
        action,
        newAmount,
        adjustmentAmount,
        newDueDate,
        timestamp: new Date().toISOString(),
      })

      for (const u of affectedUsers) {
        const inv = invoices.find((i) => i.unitId === u.unitId)
        const rev = readRevision(inv?.notes)
        if (rev?.outcome === 'REFUND_AT_OFFICE') continue
        io.to(`user:${u.id}`).emit('bill-updated', {
          organizationId: orgId,
          billingMonth,
          action,
          newAmount,
          message: rev?.residentMessage || `Your maintenance bill was revised by ${user.name}.`,
          outcome: rev?.outcome || 'REVISED',
        })
      }
    }

    // Log Immutable Audit Trail Event
    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'BILL_BULK_UPDATED',
      entityType: 'InvoiceBatch',
      entityId: billingMonth ? `Cycle-${billingMonth}` : `${updatedCount} Invoices`,
      details: `Bulk updated ${updatedCount} invoices with action ${action}${newAmount ? ` (New Amount: ₹${newAmount})` : ''}${adjustmentAmount ? ` (Adjustment: ₹${adjustmentAmount})` : ''}`,
      severity: 'WARNING',
      newValues: {
        action,
        updatedCount,
        newAmount,
        adjustmentAmount,
        newDueDate,
        totalRevisedDemand,
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({
      success: true,
      message: `Successfully bulk updated ${updatedCount} invoices`,
      updatedCount,
      totalRevisedDemand,
      billingMonth,
      action,
      overpaid,
      payRemainingCount: payRemaining.length,
    })
  } catch (err: unknown) {
    console.error('Invoices bulk update error:', err)
    return NextResponse.json({ error: 'Failed to bulk update invoices' }, { status: 500 })
  }
}
