'use client'

import React, { useEffect, useState } from 'react'

interface FundHead {
  id: string
  name: string
  category?: string
}

interface ChargeHead {
  id: string
  name: string
  amount: number
  basis: 'FIXED' | 'PER_SQFT'
  frequency: string
  gstPercent: number
  isActive: boolean
  description?: string | null
  fundHeadId?: string | null
  fundHead?: FundHead | null
}

interface BillingRules {
  billingCycle: string
  genDay: number
  dueDays: number
  gracePeriodDays: number
  lateFeeEnabled: boolean
  lateFeeAmount: number
  autoReconciliation: boolean
  sendWhatsAppReminders: boolean
}

export function AdminChargeSetup() {
  const [chargeHeads, setChargeHeads] = useState<ChargeHead[]>([])
  const [fundHeads, setFundHeads] = useState<FundHead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHead, setEditingHead] = useState<ChargeHead | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)

  // Form states
  const [formName, setFormName] = useState('')
  const [formAmount, setFormAmount] = useState('3000')
  const [formBasis, setFormBasis] = useState<'FIXED' | 'PER_SQFT'>('FIXED')
  const [formFreq, setFormFreq] = useState('MONTHLY')
  const [formFundId, setFormFundId] = useState('')
  const [formGst, setFormGst] = useState('0')
  const [formDesc, setFormDesc] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Billing rules
  const [rules, setRules] = useState<BillingRules>({
    billingCycle: 'MONTHLY',
    genDay: 1,
    dueDays: 15,
    gracePeriodDays: 15,
    lateFeeEnabled: true,
    lateFeeAmount: 200,
    autoReconciliation: true,
    sendWhatsAppReminders: true,
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const activeOrgId = typeof window !== 'undefined'
        ? (localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '')
        : ''
      const url = '/api/billing/charge-heads' + (activeOrgId ? `?orgId=${encodeURIComponent(activeOrgId)}` : '')
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load charge heads')
      const data = await res.json()
      setChargeHeads(data.chargeHeads || [])
      setFundHeads(data.fundHeads || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load charge heads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    if (typeof window !== 'undefined') {
      const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || 'default'
      const saved = localStorage.getItem('rwa_billing_rules_' + activeOrgId)
      if (saved) {
        try {
          setRules(JSON.parse(saved))
        } catch {}
      }
    }
  }, [])

  const handleSaveChargeHead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formAmount) return

    setSubmitting(true)
    try {
      const activeOrgId = typeof window !== 'undefined'
        ? (localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '')
        : ''

      const isEdit = !!editingHead
      const url = '/api/billing/charge-heads'
      const method = isEdit ? 'PUT' : 'POST'

      const body = {
        ...(isEdit ? { id: editingHead.id } : {}),
        name: formName.trim(),
        amount: parseFloat(formAmount) || 0,
        basis: formBasis,
        frequency: formFreq,
        fundHeadId: formFundId || null,
        gstPercent: parseFloat(formGst) || 0,
        description: formDesc.trim() || null,
        isActive: formIsActive,
        organizationId: activeOrgId,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Operation failed')
      }

      setShowAddModal(false)
      setEditingHead(null)
      loadData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving charge head')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (head: ChargeHead) => {
    if (!confirm(`Are you sure you want to delete "${head.name}"?`)) return
    try {
      const res = await fetch(`/api/billing/charge-heads?id=${encodeURIComponent(head.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      loadData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting charge head')
    }
  }

  const handleToggleActive = async (head: ChargeHead) => {
    try {
      await fetch('/api/billing/charge-heads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: head.id, isActive: !head.isActive }),
      })
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const openEdit = (head: ChargeHead) => {
    setEditingHead(head)
    setFormName(head.name)
    setFormAmount(String(head.amount))
    setFormBasis(head.basis)
    setFormFreq(head.frequency)
    setFormFundId(head.fundHeadId || '')
    setFormGst(String(head.gstPercent || 0))
    setFormDesc(head.description || '')
    setFormIsActive(head.isActive)
    setShowAddModal(true)
  }

  const openAdd = () => {
    setEditingHead(null)
    setFormName('')
    setFormAmount('3000')
    setFormBasis('FIXED')
    setFormFreq('MONTHLY')
    setFormFundId('')
    setFormGst('0')
    setFormDesc('')
    setFormIsActive(true)
    setShowAddModal(true)
  }

  const saveRules = (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || 'default'
      localStorage.setItem('rwa_billing_rules_' + activeOrgId, JSON.stringify(rules))
    }
    setShowConfigModal(false)
  }

  const activeHeads = chargeHeads.filter(h => h.isActive)
  const totalMonthlyFixed = activeHeads
    .filter(h => h.basis === 'FIXED')
    .reduce((sum, h) => sum + h.amount, 0)

  return (
    <div className="content fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Charge Setup & Society Fee Rules</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {activeHeads.length} charge heads active · Auto applied on monthly bill generation · Live database
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowConfigModal(true)}>
            ⚙️ Configure Rules
          </button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            + New Charge Head
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stat-grid stat-grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-icon blue">📋</div>
          <div className="stat-value">{activeHeads.length}</div>
          <div className="stat-label">Active Charge Heads</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green">₹</div>
          <div className="stat-value">₹{totalMonthlyFixed.toLocaleString('en-IN')}</div>
          <div className="stat-label">Base Monthly / Flat</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple">📅</div>
          <div className="stat-value">{rules.billingCycle === 'QUARTERLY' ? 'Quarterly' : rules.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'}</div>
          <div className="stat-label">Billing Cycle</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber">⏳</div>
          <div className="stat-value">{rules.dueDays} Days</div>
          <div className="stat-label">Grace Period Window</div>
        </div>
      </div>

      {/* Grid: Charge Heads & Billing Rules */}
      <div className="grid-2">
        {/* Left: Charge Heads */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div>
                <div className="card-title">Society Charge Heads</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Configured billing components for invoices
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-blue">{activeHeads.length} active</span>
                <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Head</button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Loading charge heads from database...
              </div>
            ) : error ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
                ⚠️ {error}
              </div>
            ) : chargeHeads.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--text-primary)' }}>
                  No Society Charge Heads Configured
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 320, margin: '0 auto 14px' }}>
                  Create charge heads like Monthly Maintenance or Sinking Fund to define fee rules for your society flats.
                </div>
                <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add First Charge Head</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chargeHeads.map(h => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border-light)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)' }}>
                    <div style={{ width: 42, height: 42, background: 'var(--blue-light)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'var(--blue)' }}>
                      ₹
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{h.name}</span>
                        {h.fundHead && <span className="badge badge-muted" style={{ fontSize: 10 }}>{h.fundHead.name}</span>}
                        {h.gstPercent > 0 && <span className="badge badge-purple" style={{ fontSize: 10 }}>{h.gstPercent}% GST</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {h.frequency} · {h.basis === 'FIXED' ? 'Flat rate' : 'Per sq. ft.'} · <strong>₹{h.amount.toLocaleString('en-IN')}</strong>{h.basis === 'PER_SQFT' ? '/sqft' : '/unit'}
                        {h.description && <span> · <em>{h.description}</em></span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        className={`badge ${h.isActive ? 'badge-green' : 'badge-muted'}`}
                        style={{ cursor: 'pointer', fontSize: 11 }}
                        onClick={() => handleToggleActive(h)}
                      >
                        {h.isActive ? '✓ Active' : '✕ Inactive'}
                      </span>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => openEdit(h)}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 11, color: 'var(--red)' }} onClick={() => handleDelete(h)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Combined Monthly Flat Rate:</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--blue)' }}>₹{totalMonthlyFixed.toLocaleString('en-IN')} / unit</span>
          </div>
        </div>

        {/* Right: Billing Engine Rules */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 14 }}>
            <div>
              <div className="card-title">Billing Engine Rules</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Automated schedule, grace period & penalty escalation
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowConfigModal(true)}>
              ⚙️ Configure Cycle
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 14, border: '1px solid var(--border-light)', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                  📅 Automated {rules.billingCycle === 'QUARTERLY' ? 'Quarterly' : rules.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'} Batch Invoicing
                </div>
                <span className="badge badge-green" style={{ fontSize: 10 }}>Active Engine</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Invoices generate automatically on the <strong>{rules.genDay}st of every {rules.billingCycle.toLowerCase()}</strong> for all occupied registry units with a <strong>{rules.dueDays} days grace period</strong>.
              </div>
            </div>

            <div style={{ padding: 14, border: '1px solid var(--border-light)', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                  💳 Razorpay & Digital Auto-Reconciliation
                </div>
                <span className="badge badge-blue" style={{ fontSize: 10 }}>Instant Settlement</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Online UPI/Card/NetBanking payments verify cryptographically via webhook signature, instantly zeroing outstanding flat balance and issuing real-time WebSocket digital receipts.
              </div>
            </div>

            <div style={{ padding: 14, border: '1px solid var(--border-light)', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                  ⚠️ Overdue Escalation & Penalty Ladder
                </div>
                <span className={`badge ${rules.lateFeeEnabled ? 'badge-amber' : 'badge-muted'}`} style={{ fontSize: 10 }}>
                  {rules.lateFeeEnabled ? 'Penalty Enabled' : 'No Late Fee'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {rules.lateFeeEnabled
                  ? `Unpaid invoices transition to OVERDUE automatically on Day ${Number(rules.dueDays) + 1} with an automated ₹${rules.lateFeeAmount} late fee penalty and automated WhatsApp dues reminder dispatches.`
                  : `Unpaid invoices transition to OVERDUE automatically on Day ${Number(rules.dueDays) + 1}. Late fees are currently waived for this society.`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 540, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingHead ? '✏️ Edit Society Charge Head' : '📋 Add Society Charge Head'}
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <form onSubmit={handleSaveChargeHead} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Charge Head Name *</label>
                <input type="text" className="form-input" value={formName} onChange={e => setFormName(e.target.value)} required placeholder="e.g. Monthly Maintenance, Security & Housekeeping" style={{ width: '100%', fontSize: 13 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Amount (₹) *</label>
                  <input type="number" className="form-input" value={formAmount} onChange={e => setFormAmount(e.target.value)} required min="0" step="0.01" style={{ width: '100%', fontSize: 13 }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Calculation Basis</label>
                  <select className="form-select" value={formBasis} onChange={e => setFormBasis(e.target.value as 'FIXED' | 'PER_SQFT')} style={{ width: '100%', fontSize: 13 }}>
                    <option value="FIXED">Fixed per Unit / Flat</option>
                    <option value="PER_SQFT">Per Sq. Ft. Area</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Billing Frequency</label>
                  <select className="form-select" value={formFreq} onChange={e => setFormFreq(e.target.value)} style={{ width: '100%', fontSize: 13 }}>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="ONE_TIME">One Time</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Fund Head Category</label>
                  <select className="form-select" value={formFundId} onChange={e => setFormFundId(e.target.value)} style={{ width: '100%', fontSize: 13 }}>
                    <option value="">General / Operating Fund</option>
                    {fundHeads.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>GST Rate (%)</label>
                  <select className="form-select" value={formGst} onChange={e => setFormGst(e.target.value)} style={{ width: '100%', fontSize: 13 }}>
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                  </select>
                </div>
                {editingHead && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Status</label>
                    <select className="form-select" value={formIsActive ? 'true' : 'false'} onChange={e => setFormIsActive(e.target.value === 'true')} style={{ width: '100%', fontSize: 13 }}>
                      <option value="true">Active (Include in Invoices)</option>
                      <option value="false">Inactive (Paused)</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Description / Purpose</label>
                <input type="text" className="form-input" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="e.g. Common electricity and maintenance" style={{ width: '100%', fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? 'Saving...' : editingHead ? 'Update Charge Head' : 'Save Charge Head 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Billing Rules Modal */}
      {showConfigModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 520, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                ⚙️ Configure Society Billing Cycle & Rules
              </div>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <form onSubmit={saveRules} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Billing Cycle Cadence *</label>
                <select className="form-select" value={rules.billingCycle} onChange={e => setRules({ ...rules, billingCycle: e.target.value })} style={{ width: '100%', fontSize: 13 }}>
                  <option value="MONTHLY">Monthly (Every 1st of the month)</option>
                  <option value="QUARTERLY">Quarterly (Jan, Apr, Jul, Oct)</option>
                  <option value="ANNUAL">Annual (Financial Year beginning)</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Batch Generation Day</label>
                  <select className="form-select" value={rules.genDay} onChange={e => setRules({ ...rules, genDay: parseInt(e.target.value) })} style={{ width: '100%', fontSize: 13 }}>
                    <option value="1">1st of the month</option>
                    <option value="5">5th of the month</option>
                    <option value="10">10th of the month</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Grace Window (Due Days) *</label>
                  <select className="form-select" value={rules.dueDays} onChange={e => setRules({ ...rules, dueDays: parseInt(e.target.value), gracePeriodDays: parseInt(e.target.value) })} style={{ width: '100%', fontSize: 13 }}>
                    <option value="10">10 Days</option>
                    <option value="15">15 Days</option>
                    <option value="20">20 Days</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>
              </div>
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--r-md)', padding: 12, background: 'var(--bg-elevated)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={rules.lateFeeEnabled} onChange={e => setRules({ ...rules, lateFeeEnabled: e.target.checked })} style={{ width: 16, height: 16 }} />
                  <span>Apply Late Fee Penalty to Overdue Invoices</span>
                </label>
                {rules.lateFeeEnabled && (
                  <div style={{ marginTop: 10 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Late Fee Amount (₹)</label>
                    <input type="number" className="form-input" value={rules.lateFeeAmount} onChange={e => setRules({ ...rules, lateFeeAmount: parseFloat(e.target.value) || 0 })} min="0" step="50" style={{ width: '100%', fontSize: 13 }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfigModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Billing Rules 🚀</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
