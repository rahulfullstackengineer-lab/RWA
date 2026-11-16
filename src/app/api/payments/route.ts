import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { notifyUsers } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import { invoiceOwing, spreadOverpaidInvoices } from '@/lib/settle-invoices'

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method') || undefined
    const status = searchParams.get('status') || undefined
    const unitId = searchParams.get('unitId') || undefined

    const orgId = user.organizationId

    if (!orgId) {
      return NextResponse.json({ success: true, payments: [] })
    }

    // Role-based scoping: Resident only sees payments for their flat
    const isResident = user.role === 'RESIDENT'
    let residentUnitId = user.unitId || null

    if (isResident && !residentUnitId && user.phone) {
      const cleanPhone = user.phone.replace(/[^0-9]/g, '').slice(-10)
      const matchedUnit = await prisma.unit.findFirst({
        where: {
          organizationId: orgId,
          OR: [
            { ownerPhone: { contains: cleanPhone } },
            { tenantPhone: { contains: cleanPhone } },
          ],
        },
      })
      if (matchedUnit) {
        residentUnitId = matchedUnit.id
      }
    }

    if (isResident && !residentUnitId) {
      return NextResponse.json({ payments: [] })
    }

    const filterUnitId = isResident ? (residentUnitId || unitId) : unitId

    const payments = await prisma.payment.findMany({
      where: {
        organizationId: orgId,
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(method && method !== 'ALL' ? { method: { contains: method } } : {}),
        ...(filterUnitId ? {
          OR: [
            { invoice: { unitId: filterUnitId } },
            { user: { unitId: filterUnitId } },
          ],
        } : {}),
      },
      include: {
        invoice: {
          include: {
            unit: {
              include: { block: true },
            },
          },
        },
        user: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    return NextResponse.json({ success: true, payments })
  } catch (err: unknown) {
    console.error('Payments GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    if (!['RWA_ADMIN', 'TREASURER'].includes(user.role)) {
      return NextResponse.json({ error: 'Only the treasurer or society admin can record a payment' }, { status: 403 })
    }

    const body = await request.json()
    const {
      unitNumber,
      unitId,
      invoiceId,
      amount,
      method = 'Cash',
      referenceNo,
      notes,
      paidAt,
      source = 'OFFLINE_ADMIN',
    } = body

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    const orgId = user.organizationId

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization selected' }, { status: 400 })
    }

    const numAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0
    await spreadOverpaidInvoices(orgId)

    // Resolve target unit
    let resolvedUnit = null
    if (unitId) {
      resolvedUnit = await prisma.unit.findFirst({
        where: { id: unitId, organizationId: orgId },
        include: { block: true },
      })
    } else if (unitNumber) {
      resolvedUnit = await prisma.unit.findFirst({
        where: {
          organizationId: orgId,
          unitNumber: unitNumber.trim(),
        },
        include: { block: true },
      })
    }

    // Apply the receipt across open bills, oldest first. A chosen invoice is settled first.
    let openInvoices = resolvedUnit
      ? await prisma.invoice.findMany({
          where: {
            organizationId: orgId,
            unitId: resolvedUnit.id,
            status: { in: ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID'] },
          },
          include: { unit: { include: { block: true } } },
          orderBy: { dueDate: 'asc' },
        })
      : []
    if (invoiceId) {
      const chosen = openInvoices.find((inv) => inv.id === invoiceId)
        || await prisma.invoice.findFirst({
          where: { id: invoiceId, organizationId: orgId },
          include: { unit: { include: { block: true } } },
        })
      if (chosen) {
        openInvoices = [chosen, ...openInvoices.filter((inv) => inv.id !== chosen.id)]
        if (!resolvedUnit) resolvedUnit = chosen.unit
      }
    }

    const slices: { invoiceId: string | null; applied: number }[] = []
    let remaining = numAmount
    for (const inv of openInvoices) {
      if (remaining <= 0.5) break
      const owing = invoiceOwing(inv)
      if (owing <= 0.5) continue
      const applied = Math.min(remaining, owing)
      slices.push({ invoiceId: inv.id, applied })
      remaining -= applied
    }
    if (remaining > 0.5 || slices.length === 0) {
      slices.push({ invoiceId: slices.length ? null : (openInvoices[0]?.id || null), applied: slices.length ? remaining : numAmount })
    }

    const paymentDate = paidAt ? new Date(paidAt) : new Date()
    const ref = referenceNo?.trim() || `REC-${Date.now().toString(36).toUpperCase()}`
    let payment = null
    let resolvedInvoice = openInvoices.find((inv) => inv.id === slices[0]?.invoiceId) || null

    for (const slice of slices) {
      if (slice.applied <= 0) continue
      const created = await prisma.payment.create({
        data: {
          organizationId: orgId,
          invoiceId: slice.invoiceId,
          userId: user.id,
          amount: slice.applied,
          currency: 'INR',
          source,
          status: 'SUCCESS',
          method,
          referenceNo: ref,
          notes: notes?.trim() || `Recorded by ${user.name}`,
          recordedByUserId: user.id,
          paidAt: paymentDate,
        },
        include: {
          invoice: {
            include: { unit: { include: { block: true } } },
          },
          user: { select: { id: true, name: true, phone: true } },
        },
      })
      if (!payment) payment = created

      if (!slice.invoiceId) continue
      const inv = openInvoices.find((row) => row.id === slice.invoiceId)
      if (!inv) continue
      const newPaid = (inv.paidAmount || 0) + slice.applied
      const newBal = Math.max(0, (inv.totalAmount || 0) - newPaid)
      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          paidAmount: newPaid,
          balanceAmount: newBal,
          status: newBal <= 0 ? 'PAID' : 'PARTIALLY_PAID',
          paidAt: newBal <= 0 ? paymentDate : undefined,
        },
      })
      inv.paidAmount = newPaid
      inv.balanceAmount = newBal
    }

    if (!payment) {
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
    }

    await notifyUsers({
      orgId,
      roles: ['admin'],
      excludeUserId: user.id,
      title: `Payment received: Flat ${resolvedUnit?.unitNumber || 'Common'}`,
      message: `₹${numAmount.toLocaleString('en-IN')} via ${payment.method}`,
      type: 'PAYMENT',
      event: 'new-payment-received',
      referenceType: 'PAYMENT',
      referenceId: payment.id,
      data: {
        paymentId: payment.id,
        amount: numAmount,
        method: payment.method,
        unitNumber: resolvedUnit?.unitNumber || 'Common',
        recordedByName: user.name,
        referenceNo: payment.referenceNo,
      },
    })
    if (resolvedUnit) {
      const flatUsers = await prisma.user.findMany({
        where: { organizationId: orgId, unitId: resolvedUnit.id },
        select: { id: true },
      })
      if (flatUsers.length > 0) {
        await notifyUsers({
          orgId,
          userIds: flatUsers.map((person) => person.id),
          title: 'Payment recorded on your flat',
          message: `₹${numAmount.toLocaleString('en-IN')} was recorded via ${payment.method}.`,
          type: 'PAYMENT',
          event: 'payment-confirmed',
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          data: {
            amount: numAmount,
            unitNumber: resolvedUnit.unitNumber,
            method: payment.method,
          },
        })
      }
    }

    // Log Immutable Audit Trail Event
    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: payment.id,
      details: `Payment ₹${numAmount.toLocaleString('en-IN')} recorded via ${payment.method} for Flat ${resolvedUnit?.unitNumber || 'Common'}${resolvedInvoice ? ` (${resolvedInvoice.invoiceNumber})` : ''}`,
      severity: 'INFO',
      newValues: {
        paymentId: payment.id,
        amount: numAmount,
        method: payment.method,
        unitNumber: resolvedUnit?.unitNumber || null,
        invoiceId: resolvedInvoice?.id || null,
        invoiceNumber: resolvedInvoice?.invoiceNumber || null,
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, payment })
  } catch (err: unknown) {
    console.error('Payments POST error:', err)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}
