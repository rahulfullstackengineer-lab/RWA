import Razorpay from 'razorpay'
import crypto from 'crypto'

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'

// Check if valid keys are configured
export const isRazorpayConfigured =
  process.env.RAZORPAY_KEY_ID &&
  !process.env.RAZORPAY_KEY_ID.includes('REPLACE_WITH') &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_SECRET.includes('REPLACE_WITH')

export const razorpayInstance = isRazorpayConfigured
  ? new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  : null

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
}

/**
 * Creates an order in Razorpay (or a simulated mock order for local dev testing)
 */
export async function createPaymentOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
  const amountInPaise = Math.round(params.amount * 100)

  if (razorpayInstance) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes || {},
      })

      return {
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        isMock: false,
      }
    } catch (err: unknown) {
      console.warn('Razorpay live order creation failed, falling back to simulated order for dev:', err)
    }
  }

  // Fallback mock order for local development
  const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  return {
    orderId: mockOrderId,
    amount: amountInPaise,
    currency: params.currency || 'INR',
    isMock: true,
  }
}

/**
 * Verifies Razorpay payment signature
 */
export function verifyPaymentSignature(params: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  // If it's a mock order from dev, allow test verification
  if (params.orderId.startsWith('order_mock_')) {
    return true
  }

  if (!isRazorpayConfigured) {
    return true // Allow dev fallback
  }

  try {
    const text = `${params.orderId}|${params.paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex')

    return expectedSignature === params.signature
  } catch (err) {
    console.error('Signature verification error:', err)
    return false
  }
}
