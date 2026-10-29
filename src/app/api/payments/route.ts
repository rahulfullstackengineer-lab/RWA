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
    const method = searchParams.get('method') || undefined
    const status = searchParams.get('status') || undefined
    const unitId = searchParams.get('unitId') || undefined

    let orgId = searchParams.get('orgId') || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || null
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization selected' }, { status: 400 })
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

    let orgId = body.organizationId || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || null
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization selected' }, { status: 400 })
    }

    const numAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0

    // Resolve target unit
    let resolvedUnit = null
    if (unitId) {
      resolvedUnit = await prisma.unit.findUnique({
        where: { id: unitId },
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

    // Resolve target invoice
    let resolvedInvoice = null
    if (invoiceId) {
      resolvedInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { unit: { include: { block: true } } },
      })
    } else if (resolvedUnit) {
      // Find oldest pending / issued invoice for this unit
      resolvedInvoice = await prisma.invoice.findFirst({
        where: {
          unitId: resolvedUnit.id,
          status: { in: ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID'] },
        },
        include: { unit: { include: { block: true } } },
        orderBy: { dueDate: 'asc' },
      })
    }

    // If unit wasn't directly found, derive from invoice
    if (!resolvedUnit && resolvedInvoice) {
      resolvedUnit = resolvedInvoice.unit
    }

    const paymentDate = paidAt ? new Date(paidAt) : new Date()
    const ref = referenceNo?.trim() || `REC-${Date.now().toString(36).toUpperCase()}`

    const payment = await prisma.payment.create({
      data: {
        organizationId: orgId,
        invoiceId: resolvedInvoice?.id || null,
        userId: user.id,
        amount: numAmount,
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

    // Settle linked invoice
    if (resolvedInvoice) {
      const newPaid = (resolvedInvoice.paidAmount || 0) + numAmount
      const newBal = Math.max(0, (resolvedInvoice.totalAmount || 0) - newPaid)
      await prisma.invoice.update({
        where: { id: resolvedInvoice.id },
        data: {
          paidAmount: newPaid,
          balanceAmount: newBal,
          status: newBal <= 0 ? 'PAID' : 'PARTIALLY_PAID',
          paidAt: newBal <= 0 ? paymentDate : undefined,
        },
      })
    }

    // Emit live socket event
    emitLiveSocketEvent('new-payment-received', {
      paymentId: payment.id,
      amount: payment.amount,
      method: payment.method,
      unitNumber: resolvedUnit?.unitNumber || 'Common',
      recordedByName: user.name,
      referenceNo: payment.referenceNo,
    }, { orgId })

    // Log Immutable Audit Trail Event
    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: payment.id,
      details: `Payment ₹${payment.amount.toLocaleString('en-IN')} recorded via ${payment.method} for Flat ${resolvedUnit?.unitNumber || 'Common'}${resolvedInvoice ? ` (${resolvedInvoice.invoiceNumber})` : ''}`,
      severity: 'INFO',
      newValues: {
        paymentId: payment.id,
        amount: payment.amount,
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
