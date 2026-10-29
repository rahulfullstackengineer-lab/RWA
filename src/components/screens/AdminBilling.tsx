'use client'

import React, { useEffect, useState } from 'react'

interface Invoice {
  id: string
  invoiceNumber: string
  billingMonth: string
  dueDate: string
  status: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  unit: {
    unitNumber: string
    block: { name: string } | null
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
}

export function AdminBilling() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [genMessage, setGenMessage] = useState<string | null>(null)

  const loadInvoices = async () => {
    try {
      const url = statusFilter ? `/api/billing/invoices?status=${statusFilter}` : '/api/billing/invoices'
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setInvoices(json.invoices || [])
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
  }, [statusFilter])

  const handleGenerateInvoices = async () => {
    setIsGenerating(true)
    setGenMessage(null)

    try {
      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingMonth: currentMonth }),
      })

      const data = await res.json()
      if (res.ok) {
        setGenMessage(data.message)
        loadInvoices()
      } else {
        setGenMessage(data.error || 'Failed to generate')
      }
    } catch (e) {
      setGenMessage('Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0)
  const totalCollected = invoices.reduce((s, i) => s + i.paidAmount, 0)
  const totalPending = invoices.reduce((s, i) => s + i.balanceAmount, 0)

  return (
    <div className="content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Billing & Society Maintenance</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Automated monthly fee generation, payment tracking, and Razorpay reconciliation
          </p>
        </div>

        <button
          onClick={handleGenerateInvoices}
          disabled={isGenerating}
          className="btn btn-primary btn-sm"
        >
          {isGenerating ? '⚡ Generating...' : '⚡ Generate Current Month Bills'}
        </button>
      </div>

      {genMessage && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#059669',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {genMessage}
        </div>
      )}

      {/* Summary Cards */}
      <div className="stat-grid stat-grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-title">Total Billed</div>
          <div className="stat-value">₹{totalBilled.toLocaleString('en-IN')}</div>
          <div className="stat-sub">{invoices.length} invoices generated</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Total Collected</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <div className="stat-sub">
            {totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0}% collection rate
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Pending Balance</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <div className="stat-sub">Outstanding dues</div>
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { id: '', label: 'All Invoices' },
          { id: 'ISSUED', label: 'Unpaid / Issued' },
          { id: 'PAID', label: 'Paid' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`btn ${statusFilter === f.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Flat / Unit</th>
                <th>Billing Period</th>
                <th>Due Date</th>
                <th>Total Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    No invoices found. Click &quot;Generate Current Month Bills&quot; above to create them.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{inv.invoiceNumber}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{inv.unit.unitNumber}</span> ({inv.unit.block?.name || 'General'})
                    </td>
                    <td>{inv.billingMonth}</td>
                    <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td>
                      <span style={{ fontWeight: 800 }}>₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          inv.status === 'PAID'
                            ? 'badge-green'
                            : inv.status === 'OVERDUE'
                            ? 'badge-red'
                            : 'badge-amber'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
