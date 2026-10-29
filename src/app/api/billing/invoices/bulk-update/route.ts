import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

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

    let orgId = body.organizationId || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || null
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization selected' }, { status: 400 })
    }

    // Build filter for target invoices (bulk update applies to non-paid invoices)
    const filter: any = {
      organizationId: orgId,
      status: { not: 'PAID' },
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
        { error: 'No unpaid invoices found matching the selected criteria' },
        { status: 404 }
      )
    }

    let updatedCount = 0
    let totalRevisedDemand = 0

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
        const balance = Math.max(0, revisedTotal - inv.paidAmount)
        const newStatus = balance === 0 ? 'PAID' : (inv.paidAmount > 0 ? 'PARTIALLY_PAID' : 'ISSUED')

        // Replace line items with revised head
        await prisma.invoiceItem.deleteMany({
          where: { invoiceId: inv.id },
        })

        await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            totalAmount: revisedTotal,
            balanceAmount: balance,
            status: newStatus,
            items: {
              create: [
                {
                  description: adjustmentReason || 'Revised Monthly Maintenance Charge',
                  amount: revisedTotal,
                  gstPercent: 0,
                  gstAmount: 0,
                  totalAmount: revisedTotal,
                },
              ],
            },
          },
        })

        totalRevisedDemand += revisedTotal
        updatedCount++
      } else if (action === 'APPLY_ADJUSTMENT' && adjustmentAmount !== undefined) {
        const adj = Number(adjustmentAmount)
        const revisedTotal = Math.max(0, inv.totalAmount + adj)
        const balance = Math.max(0, revisedTotal - inv.paidAmount)
        const newStatus = balance === 0 ? 'PAID' : (inv.paidAmount > 0 ? 'PARTIALLY_PAID' : 'ISSUED')

        await prisma.invoiceItem.create({
          data: {
            invoiceId: inv.id,
            description: `Adjustment: ${adjustmentReason} (${adj >= 0 ? '+' : '-'}₹${Math.abs(adj)})`,
            amount: adj,
            gstPercent: 0,
            gstAmount: 0,
            totalAmount: adj,
          },
        })

        await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            totalAmount: revisedTotal,
            balanceAmount: balance,
            status: newStatus,
          },
        })

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

    const notifData = affectedUsers.map((u) => {
      const inv = invoices.find((i) => i.unitId === u.unitId)
      return {
        organizationId: orgId,
        userId: u.id,
        title: `🔄 Revised Maintenance Bill: ${billingMonth || 'Active Cycle'}`,
        message:
          action === 'SET_AMOUNT'
            ? `Your maintenance bill for ${billingMonth} was revised to ₹${Number(newAmount).toLocaleString('en-IN')}.`
            : action === 'APPLY_ADJUSTMENT'
            ? `An adjustment of ${Number(adjustmentAmount) >= 0 ? '+' : ''}₹${Number(adjustmentAmount).toLocaleString('en-IN')} (${adjustmentReason}) was applied to your bill.`
            : `The payment due date for your ${billingMonth} bill has been updated.`,
        type: 'BILL',
        referenceType: 'INVOICE',
        referenceId: inv ? inv.id : null,
      }
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
        io.to(`user:${u.id}`).emit('bill-updated', {
          organizationId: orgId,
          billingMonth,
          action,
          newAmount,
          message: `Your maintenance bill has been updated by the RWA committee.`,
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
    })
  } catch (err: unknown) {
    console.error('Invoices bulk update error:', err)
    return NextResponse.json({ error: 'Failed to bulk update invoices' }, { status: 500 })
  }
}
