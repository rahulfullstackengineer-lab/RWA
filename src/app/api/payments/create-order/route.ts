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

    if (!invoiceId && Number(body.amount) > 0 && user.organizationId) {
      const amount = Number(body.amount)
      const description = String(body.description || 'Society payment').slice(0, 120)
      const organization = await prisma.organization.findUnique({ where: { id: user.organizationId } })
      const keyId = organization?.razorpayKeyId || ''
      const keySecret = organization?.razorpayKeySecret || ''
      if (!organization || !keyId || !keySecret) {
        return NextResponse.json({
          error: 'This society has not connected a Razorpay account. The office can add it in Settings under My Bank Account.',
        }, { status: 400 })
      }
      const order = await createPaymentOrder({
        amount,
        currency: 'INR',
        receipt: `pay_${Date.now()}`.slice(0, 40),
        notes: { description, organizationId: organization.id, userId: user.id },
      }, { keyId, keySecret })
      const payment = await prisma.payment.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          amount,
          currency: 'INR',
          source: 'ONLINE_GATEWAY',
          status: 'PENDING',
          notes: description,
          razorpayOrderId: order.orderId,
        },
      })
      return NextResponse.json({
        success: true,
        order: { id: order.orderId, amount: order.amount, currency: order.currency, isMock: false },
        invoice: {
          id: null,
          invoiceNumber: description,
          amount,
          unitNumber: '',
          societyName: organization.name,
        },
        paymentId: payment.id,
        razorpayKeyId: keyId,
      })
    }

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
    const keyId = invoice.organization.razorpayKeyId || ''
    const keySecret = invoice.organization.razorpayKeySecret || ''
    if (!keyId || !keySecret) {
      return NextResponse.json({
        error: 'This society has not connected a Razorpay account. The office can add it in Settings under My Bank Account.',
      }, { status: 400 })
    }

    const order = await createPaymentOrder({
      amount: payableAmount,
      currency: 'INR',
      receipt: `rcpt_${invoice.invoiceNumber}`.slice(0, 40),
      notes: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        unitNumber: invoice.unit.unitNumber,
        organizationId: invoice.organizationId,
        userId: user.id,
      },
    }, { keyId, keySecret })

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
      razorpayKeyId: keyId,
    })
  } catch (err: unknown) {
    console.error('Create order error:', err)
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
