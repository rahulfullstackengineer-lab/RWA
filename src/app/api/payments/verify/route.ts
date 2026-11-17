import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { verifyPaymentSignature } from '@/lib/razorpay'
import { emitLiveSocketEvent, notifyUsers } from '@/lib/socket-server'

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      invoiceId,
      method = 'ONLINE',
    } = body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing Razorpay payment details' }, { status: 400 })
    }

    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId },
      include: {
        invoice: {
          include: { unit: true, organization: true },
        },
      },
    })

    const finalInvoiceId = payment?.invoiceId || invoiceId

    if (payment && !finalInvoiceId) {
      const society = await prisma.organization.findUnique({
        where: { id: payment.organizationId },
        select: { razorpayKeySecret: true },
      })
      const isValid = verifyPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
        keySecret: society?.razorpayKeySecret || '',
      })
      if (!isValid) {
        return NextResponse.json({ error: 'Razorpay did not confirm this payment.' }, { status: 400 })
      }
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          razorpayPaymentId,
          razorpaySignature,
          method,
          paidAt: new Date(),
        },
      })
      return NextResponse.json({
        success: true,
        message: 'Payment verified',
        paymentId: razorpayPaymentId,
      })
    }

    const invoice = finalInvoiceId
      ? await prisma.invoice.findFirst({
          where: {
            AND: [
              {
                OR: [
                  { id: finalInvoiceId },
                  { invoiceNumber: finalInvoiceId },
                ],
              },
              ...(user.organizationId ? [{ organizationId: user.organizationId }] : []),
            ],
          },
          include: { unit: true },
        })
      : null

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const society = await prisma.organization.findUnique({
      where: { id: invoice.organizationId },
      select: { razorpayKeySecret: true },
    })
    const isValid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      keySecret: society?.razorpayKeySecret || '',
    })
    if (!isValid) {
      return NextResponse.json({ error: 'Razorpay did not confirm this payment. The bill is still unpaid.' }, { status: 400 })
    }

    const finalPaymentId = razorpayPaymentId

    // 1. Update or create Payment record as SUCCESS
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          razorpayPaymentId: finalPaymentId,
          razorpaySignature,
          method,
          paidAt: new Date(),
        },
      })
    } else {
      await prisma.payment.create({
        data: {
          organizationId: invoice.organizationId,
          invoiceId: invoice.id,
          userId: user.id,
          amount: invoice.totalAmount,
          currency: 'INR',
          source: 'ONLINE_GATEWAY',
          status: 'SUCCESS',
          razorpayOrderId,
          razorpayPaymentId: finalPaymentId,
          razorpaySignature,
          method,
          paidAt: new Date(),
        },
      })
    }

    // 2. Mark invoice as PAID
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PAID',
        paidAmount: invoice.totalAmount,
        balanceAmount: 0,
        paidAt: new Date(),
      },
      include: { unit: true },
    })

    // 3. Create persistent Notification in DB
    const notif = await prisma.notification.create({
      data: {
        organizationId: invoice.organizationId,
        userId: user.id,
        title: 'Payment Successful! 🎉',
        message: `Your payment of ₹${invoice.totalAmount.toLocaleString('en-IN')} for invoice ${invoice.invoiceNumber} (Flat ${invoice.unit.unitNumber}) was successfully processed.`,
        type: 'PAYMENT',
        referenceType: 'INVOICE',
        referenceId: invoice.id,
      },
    })

    // 4. Emit real-time Socket.io event to user room & org room
    emitLiveSocketEvent('payment-confirmed', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.totalAmount,
      unitNumber: invoice.unit.unitNumber,
      paymentId: finalPaymentId,
      notification: notif,
    }, { userId: user.id })

    await notifyUsers({
      orgId: invoice.organizationId,
      roles: ['admin'],
      excludeUserId: user.id,
      title: 'New maintenance payment received',
      message: `Flat ${invoice.unit.unitNumber} paid ₹${invoice.totalAmount.toLocaleString('en-IN')}`,
      type: 'PAYMENT',
      event: 'new-payment-received',
      referenceType: 'INVOICE',
      referenceId: invoice.id,
      data: {
        amount: invoice.totalAmount,
        unitNumber: invoice.unit.unitNumber,
        paidAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified and invoice marked as PAID',
      invoice: updatedInvoice,
      paymentId: finalPaymentId,
    })
  } catch (err: unknown) {
    console.error('Payment verification error:', err)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}
