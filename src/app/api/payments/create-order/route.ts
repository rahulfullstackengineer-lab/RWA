import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createPaymentOrder } from '@/lib/razorpay'

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Fetch invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        unit: true,
        organization: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice is already fully paid' }, { status: 400 })
    }

    if (user.role === 'RESIDENT') {
      const phone = String(user.phone || '').replace(/\D/g, '').slice(-10)
      const ownerPhone = String(invoice.unit.ownerPhone || '').replace(/\D/g, '').slice(-10)
      const tenantPhone = String(invoice.unit.tenantPhone || '').replace(/\D/g, '').slice(-10)
      const ownsFlat = user.unitId === invoice.unitId
        || (phone.length === 10 && (phone === ownerPhone || phone === tenantPhone))
      if (!ownsFlat) {
        return NextResponse.json({ error: 'You can only pay for your own registered unit' }, { status: 403 })
      }
    }

    const payableAmount = invoice.balanceAmount > 0 ? invoice.balanceAmount : invoice.totalAmount

    // Call Razorpay
    const order = await createPaymentOrder({
      amount: payableAmount,
      currency: 'INR',
      receipt: `rcpt_${invoice.invoiceNumber}`,
      notes: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        unitNumber: invoice.unit.unitNumber,
        organizationId: invoice.organizationId,
        userId: user.id,
      },
    })

    // Create a pending payment record
    const payment = await prisma.payment.create({
      data: {
        organizationId: invoice.organizationId,
        invoiceId: invoice.id,
        userId: user.id,
        amount: payableAmount,
        currency: 'INR',
        source: 'ONLINE_GATEWAY',
        status: 'PENDING',
        razorpayOrderId: order.orderId,
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        isMock: order.isMock,
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: payableAmount,
        unitNumber: invoice.unit.unitNumber,
        societyName: invoice.organization.name,
      },
      paymentId: payment.id,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    })
  } catch (err: unknown) {
    console.error('Create order error:', err)
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
