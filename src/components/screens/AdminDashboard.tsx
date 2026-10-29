'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface DashboardData {
  stats: {
    totalUnits: number
    occupiedUnits: number
    vacantUnits: number
    occupancyRate: number
    totalMembers: number
    billedAmount: number
    collectedAmount: number
    pendingAmount: number
    collectionRate: number
    openComplaints: number
    resolvedComplaints: number
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentNotices: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentComplaints: any[]
}

export function AdminDashboard({ onSelectTab }: { onSelectTab: (tab: string) => void }) {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading dashboard metrics...
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="content fade-in">
      {/* Top Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderTop: '3px solid var(--blue)',
          borderRadius: 'var(--r-lg)',
          padding: '20px 24px',
          marginBottom: 20,
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-blue">Admin Control Center</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Registered Society: CH-RWA-2018-092
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            Welcome, {user?.name} 👋
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Real-time overview of collections, occupied units, open complaints, and notices.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => onSelectTab('admin-billing')} className="btn btn-primary btn-sm">
            💳 Generate Invoices
          </button>
          <button onClick={() => onSelectTab('admin-notices')} className="btn btn-secondary btn-sm">
            📢 Post Notice
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stat-grid stat-grid-4" style={{ marginBottom: 24 }}>
        {/* Stat 1: Collections */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">October Collections</span>
            <div className="stat-icon-wrap" style={{ background: '#EFF6FF', color: 'var(--blue)' }}>
              💰
            </div>
          </div>
          <div className="stat-value">₹{(stats?.collectedAmount || 0).toLocaleString('en-IN')}</div>
          <div className="stat-sub">
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>
              {stats?.collectionRate || 0}%
            </span>{' '}
            of ₹{(stats?.billedAmount || 0).toLocaleString('en-IN')} billed
          </div>
        </div>

        {/* Stat 2: Pending Dues */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Pending Defaulters</span>
            <div className="stat-icon-wrap" style={{ background: '#FFF1F2', color: 'var(--red)' }}>
              ⚠️
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>
            ₹{(stats?.pendingAmount || 0).toLocaleString('en-IN')}
          </div>
          <div className="stat-sub">
            Due by 15th October · <span style={{ fontWeight: 600 }}>1 unit pending</span>
          </div>
        </div>

        {/* Stat 3: Occupancy */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Units & Occupancy</span>
            <div className="stat-icon-wrap" style={{ background: '#ECFDF5', color: 'var(--green)' }}>
              🏢
            </div>
          </div>
          <div className="stat-value">
            {stats?.occupiedUnits} / {stats?.totalUnits}
          </div>
          <div className="stat-sub">
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>{stats?.occupancyRate}%</span>{' '}
            occupancy across 3 towers
          </div>
        </div>

        {/* Stat 4: Open Tickets */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Helpdesk Tickets</span>
            <div className="stat-icon-wrap" style={{ background: '#FEF3C7', color: 'var(--amber)' }}>
              🎫
            </div>
          </div>
          <div className="stat-value">{stats?.openComplaints} Open</div>
          <div className="stat-sub">
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>
              {stats?.resolvedComplaints} resolved
            </span>{' '}
            this month
          </div>
        </div>
      </div>

      {/* Main Grid: Notices & Recent Tickets */}
      <div className="dashboard-main-grid">
        {/* Recent Notices */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📢 Active Society Announcements</div>
            <button
              onClick={() => onSelectTab('admin-notices')}
              className="btn btn-ghost btn-sm"
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data?.recentNotices?.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: 14,
                  borderRadius: 8,
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>
                    {n.type}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {n.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  {n.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🎫 Recent Helpdesk Complaints</div>
            <button
              onClick={() => onSelectTab('admin-complaints')}
              className="btn btn-ghost btn-sm"
            >
              Manage
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data?.recentComplaints?.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: 14,
                  borderRadius: 8,
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span
                    className={`badge ${
                      c.status === 'RESOLVED'
                        ? 'badge-green'
                        : c.status === 'IN_PROGRESS'
                        ? 'badge-amber'
                        : 'badge-red'
                    }`}
                    style={{ fontSize: 10 }}
                  >
                    {c.ticketNumber} · {c.status}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Flat {c.unit?.unitNumber || 'Common'}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {c.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Raised by {c.raisedBy?.name} · Priority: {c.priority}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
