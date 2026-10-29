'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { RazorpayModal } from '@/components/RazorpayModal'

interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  billingMonth: string
  dueDate: string
  status: string
  unit: { unitNumber: string }
}

export function ResidentDashboard({ onSelectTab }: { onSelectTab: (tab: string) => void }) {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null)

  const loadData = async () => {
    try {
      const [invRes, notRes] = await Promise.all([
        fetch('/api/billing/invoices'),
        fetch('/api/notices'),
      ])
      if (invRes.ok) {
        const invData = await invRes.json()
        setInvoices(invData.invoices || [])
      }
      if (notRes.ok) {
        const notData = await notRes.json()
        setNotices(notData.notices || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const pendingInvoice = invoices.find((i) => i.status === 'ISSUED' || i.status === 'OVERDUE')
  const totalPendingBalance = invoices.reduce((s, i) => s + i.balanceAmount, 0)

  return (
    <div className="content fade-in">
      {/* Resident Welcome Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderTop: '3px solid var(--blue)',
          borderRadius: 'var(--r-lg)',
          padding: '24px 28px',
          marginBottom: 24,
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-green" style={{ fontSize: 11 }}>
              Flat {user?.unitNumber || 'A-101'} · {user?.blockName || 'Tower Sunflower'} · Resident
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Society ID: RWA-2022-048</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Namaste, {user?.name} 👋
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 550, lineHeight: 1.5 }}>
            Welcome to Greenfield Heights Resident Portal. Pay maintenance dues online via Razorpay, raise helpdesk tickets, and view official announcements.
          </div>
        </div>

        {/* Outstanding Dues Card */}
        <div
          style={{
            textAlign: 'right',
            background: 'var(--bg-elevated)',
            padding: '16px 20px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            flexShrink: 0,
            minWidth: 220,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
            Outstanding Balance
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: totalPendingBalance > 0 ? 'var(--red)' : 'var(--green)',
              marginBottom: 8,
              letterSpacing: '-0.02em',
            }}
          >
            ₹{totalPendingBalance.toLocaleString('en-IN')}
          </div>

          {totalPendingBalance > 0 && pendingInvoice ? (
            <button
              onClick={() => setPayingInvoice(pendingInvoice)}
              className="btn btn-primary btn-sm w-full"
              style={{ justifyContent: 'center', fontWeight: 700 }}
            >
              ⚡ Pay via Razorpay
            </button>
          ) : (
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              ✓ All dues cleared for current month
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="stat-grid stat-grid-4" style={{ marginBottom: 24 }}>
        {[
          { icon: '📄', title: 'My Invoices', desc: totalPendingBalance > 0 ? `₹${totalPendingBalance} pending` : 'All cleared', tab: 'resident-bills' },
          { icon: '🎫', title: 'Helpdesk Tickets', desc: 'Raise repair issue', tab: 'resident-complaints' },
          { icon: '📢', title: 'Notice Board', desc: `${notices.length} notices posted`, tab: 'resident-notices' },
          { icon: '💳', title: 'Payment History', desc: 'Download receipts', tab: 'resident-bills' },
        ].map((q, idx) => (
          <div
            key={idx}
            className="card"
            style={{ cursor: 'pointer', padding: 14, transition: 'all 0.15s' }}
            onClick={() => onSelectTab(q.tab)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {q.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{q.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="dashboard-main-grid">
        {/* Latest Announcements */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📢 Latest Announcements</div>
            <button onClick={() => onSelectTab('resident-notices')} className="btn btn-ghost btn-sm">
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notices.slice(0, 3).map((n) => (
              <div
                key={n.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="badge badge-purple" style={{ fontSize: 10 }}>
                    {n.type}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                  {n.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Invoices / Receipts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📄 My Bills & Receipts</div>
            <button onClick={() => onSelectTab('resident-bills')} className="btn btn-ghost btn-sm">
              View All
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Loading bills...</div>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No invoices found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: inv.status === 'PAID' ? '#F8FAFC' : '#FFFBEB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{inv.invoiceNumber}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Period: {inv.billingMonth} · Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </div>
                    {inv.status === 'PAID' ? (
                      <span className="badge badge-green" style={{ fontSize: 10 }}>
                        ✓ PAID
                      </span>
                    ) : (
                      <button
                        onClick={() => setPayingInvoice(inv)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: 10, padding: '3px 8px', marginTop: 4 }}
                      >
                        ⚡ Pay Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Razorpay Modal for Resident */}
      {payingInvoice && (
        <RazorpayModal
          isOpen={true}
          onClose={() => setPayingInvoice(null)}
          onSuccess={() => {
            setPayingInvoice(null)
            loadData()
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
