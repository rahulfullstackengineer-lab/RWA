import Razorpay from 'razorpay'
import crypto from 'crypto'

export interface RazorpayCredentials {
  keyId: string
  keySecret: string
}

export interface CreateOrderParams {
  amount: number // in INR (will be converted to paise)
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

export interface RazorpayOrderResult {
  orderId: string
  amount: number // in paise
  currency: string
  isMock: boolean
  keyId: string
}

export function razorpayClient(credentials: RazorpayCredentials) {
  return new Razorpay({
    key_id: credentials.keyId,
    key_secret: credentials.keySecret,
  })
}

export async function createPaymentOrder(
  params: CreateOrderParams,
  credentials: RazorpayCredentials,
): Promise<RazorpayOrderResult> {
  const amountInPaise = Math.round(params.amount * 100)
  const order = await razorpayClient(credentials).orders.create({
    amount: amountInPaise,
    currency: params.currency || 'INR',
    receipt: params.receipt.slice(0, 40),
    notes: params.notes || {},
  })

  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    isMock: false,
    keyId: credentials.keyId,
  }
}

export function verifyPaymentSignature(params: {
  orderId: string
  paymentId: string
  signature: string
  keySecret: string
}): boolean {
  if (!params.keySecret || !params.paymentId || !params.signature) return false
  if (params.orderId.startsWith('order_mock_') || params.signature === 'dev_mock_signature') return false

  try {
    const text = `${params.orderId}|${params.paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', params.keySecret)
      .update(text)
      .digest('hex')

    return expectedSignature === params.signature
  } catch (err) {
    console.error('Signature verification error:', err)
    return false
  }
}
