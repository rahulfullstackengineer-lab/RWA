'use client'

import React, { useState } from 'react'

interface RazorpayModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (paymentId: string) => void
  invoice: {
    id: string
    invoiceNumber: string
    totalAmount: number
    balanceAmount: number
    unitNumber: string
    billingMonth: string
  }
}

export function RazorpayModal({ isOpen, onClose, onSuccess, invoice }: RazorpayModalProps) {
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking'>('upi')
  const [upiId, setUpiId] = useState('resident@upi')
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8910')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const payableAmount = invoice.balanceAmount > 0 ? invoice.balanceAmount : invoice.totalAmount

  const handlePay = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // 1. Create Order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create payment order')
      }

      // Check if real Razorpay checkout is available on window and configured
      const hasRealKey =
        orderData.razorpayKeyId &&
        !orderData.razorpayKeyId.includes('REPLACE_WITH') &&
        !orderData.order.isMock &&
        typeof window !== 'undefined' &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).Razorpay

      if (hasRealKey) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay({
          key: orderData.razorpayKeyId,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: 'Greenfield Heights RWA',
          description: `Maintenance Bill ${invoice.invoiceNumber} (${invoice.unitNumber})`,
          order_id: orderData.order.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handler: async function (response: any) {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
          },
          prefill: {
            contact: '9876543212',
          },
          theme: {
            color: '#2563EB',
          },
        })
        rzp.open()
        setIsProcessing(false)
        return
      }

      // Local Simulated Razorpay Gateway Processing
      await new Promise((resolve) => setTimeout(resolve, 1200))

      const mockPaymentId = `pay_rzp_${Date.now()}`
      await verifyPayment({
        razorpayOrderId: orderData.order.id,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: 'mock_signature_valid',
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setIsProcessing(false)
    }
  }

  const verifyPayment = async (data: {
    razorpayOrderId: string
    razorpayPaymentId: string
    razorpaySignature: string
  }) => {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        invoiceId: invoice.id,
        method: activeTab.toUpperCase(),
      }),
    })

    const result = await res.json()
    if (!res.ok) {
      throw new Error(result.error || 'Payment verification failed')
    }

    setIsProcessing(false)
    onSuccess(result.paymentId)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          maxWidth: 440,
          width: '100%',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Razorpay Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0C2340 0%, #1D4ED8 100%)',
            padding: '20px 24px',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>⚡</span>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', opacity: 0.9 }}>
                  RAZORPAY SECURE
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Greenfield Heights RWA</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                Invoice {invoice.invoiceNumber} · Flat {invoice.unitNumber}
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                width: 28,
                height: 28,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              marginTop: 16,
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.9 }}>Amount Payable</span>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
              ₹{payableAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 12 }}>
            Select Payment Method
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { id: 'upi', label: 'UPI / QR', icon: '📱' },
              { id: 'card', label: 'Card', icon: '💳' },
              { id: 'netbanking', label: 'Net Banking', icon: '🏛️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'upi' | 'card' | 'netbanking')}
                style={{
                  flex: 1,
                  padding: '9px 8px',
                  borderRadius: 8,
                  border: activeTab === tab.id ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  background: activeTab === tab.id ? '#EFF6FF' : '#F8FAFC',
                  color: activeTab === tab.id ? '#1D4ED8' : '#475569',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  transition: 'all 0.15s',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'upi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setUpiId(`${app.toLowerCase()}@upi`)}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {app}
                  </button>
                ))}
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@okhdfcbank"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  defaultValue="12/28"
                  placeholder="MM/YY"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                  }}
                />
                <input
                  type="password"
                  defaultValue="888"
                  placeholder="CVV"
                  style={{
                    width: 90,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'netbanking' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((bank) => (
                <button
                  key={bank}
                  type="button"
                  style={{
                    padding: '12px 10px',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1E293B',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  🏛️ {bank}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: 14,
                padding: '8px 12px',
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                borderRadius: 6,
                color: '#BE123C',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handlePay}
            disabled={isProcessing}
            style={{
              marginTop: 20,
              width: '100%',
              padding: '13px 16px',
              borderRadius: 8,
              background: isProcessing ? '#94A3B8' : '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.15s',
            }}
          >
            {isProcessing ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                <span>Connecting to Gateway...</span>
              </>
            ) : (
              <>
                <span>🔒 Pay ₹{payableAmount.toLocaleString('en-IN')}</span>
              </>
            )}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 14,
              fontSize: 11,
              color: '#94A3B8',
            }}
          >
            <span>🛡️ 256-bit SSL Encryption</span>
            <span>·</span>
            <span>Razorpay Verified</span>
          </div>
        </div>
      </div>
    </div>
  )
}
