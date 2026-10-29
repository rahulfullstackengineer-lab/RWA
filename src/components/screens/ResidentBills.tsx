'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { RazorpayModal } from '@/components/RazorpayModal'

interface InvoiceItem {
  id: string
  description: string
  amount: number
  gstPercent: number
  gstAmount: number
  totalAmount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  billingMonth: string
  dueDate: string
  status: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paidAt: string | null
  items: InvoiceItem[]
  unit: { unitNumber: string }
}

export function ResidentBills() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)

  const loadInvoices = async () => {
    try {
      const res = await fetch('/api/billing/invoices')
      if (res.ok) {
        const json = await res.json()
        setInvoices(json.invoices || [])
        if (json.invoices?.length > 0 && !selectedInvoice) {
          setSelectedInvoice(json.invoices[0])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>My Invoices & Online Payments</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Flat {user?.unitNumber || 'A-101'} · Monthly maintenance, water dues, and sinking fund
          </p>
        </div>
      </div>

      {paymentSuccess && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#059669',
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>🎉 Payment of ₹{paymentSuccess} successfully completed and verified via Razorpay!</span>
          <button
            onClick={() => setPaymentSuccess(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', fontWeight: 800 }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }} className="bill-grid-responsive">
        {/* Left: Invoice List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
            Invoices History
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      Loading invoices...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      No invoices found for your unit
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      style={{
                        background: selectedInvoice?.id === inv.id ? 'var(--blue-light)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{inv.invoiceNumber}</span>
                      </td>
                      <td>{inv.billingMonth}</td>
                      <td>
                        <span style={{ fontWeight: 800 }}>₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                      </td>
                      <td>
                        <span className={`badge ${inv.status === 'PAID' ? 'badge-green' : 'badge-amber'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td>
                        {inv.status === 'PAID' ? (
                          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>✓ Receipt</span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setPayingInvoice(inv)
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: 11, padding: '3px 8px' }}
                          >
                            ⚡ Pay Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Detailed Invoice Breakdown */}
        {selectedInvoice ? (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span className="badge badge-blue">DIGITAL INVOICE</span>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{selectedInvoice.invoiceNumber}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </div>
              </div>
              <span className={`badge ${selectedInvoice.status === 'PAID' ? 'badge-green' : 'badge-red'}`}>
                {selectedInvoice.status}
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                FEE BREAKDOWN
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedInvoice.items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      padding: '6px 0',
                      borderBottom: '1px dashed var(--border-light)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.description}</div>
                      {item.gstPercent > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Base: ₹{item.amount} + GST ({item.gstPercent}%): ₹{item.gstAmount}
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 700 }}>₹{item.totalAmount.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 14,
                  paddingTop: 10,
                  borderTop: '2px solid var(--border)',
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                <span>Total Amount</span>
                <span style={{ color: 'var(--blue)' }}>₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {selectedInvoice.status !== 'PAID' ? (
              <button
                onClick={() => setPayingInvoice(selectedInvoice)}
                className="btn btn-primary w-full"
                style={{ justifyContent: 'center', padding: '12px', fontSize: 14, fontWeight: 700 }}
              >
                ⚡ Pay ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')} via Razorpay
              </button>
            ) : (
              <div
                style={{
                  background: '#ECFDF5',
                  padding: 12,
                  borderRadius: 8,
                  textAlign: 'center',
                  color: '#059669',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ✓ Bill Paid in Full on{' '}
                {selectedInvoice.paidAt ? new Date(selectedInvoice.paidAt).toLocaleDateString() : 'Online'}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select an invoice to view full breakdown
          </div>
        )}
      </div>

      {/* Razorpay Modal */}
      {payingInvoice && (
        <RazorpayModal
          isOpen={true}
          onClose={() => setPayingInvoice(null)}
          onSuccess={() => {
            setPaymentSuccess(payingInvoice.totalAmount.toLocaleString('en-IN'))
            setPayingInvoice(null)
            loadInvoices()
          }}
          invoice={{
            id: payingInvoice.id,
            invoiceNumber: payingInvoice.invoiceNumber,
            totalAmount: payingInvoice.totalAmount,
            balanceAmount: payingInvoice.balanceAmount,
            unitNumber: payingInvoice.unit?.unitNumber || user?.unitNumber || 'A-101',
            billingMonth: payingInvoice.billingMonth,
          }}
        />
      )}
    </div>
  )
}
