'use client'

import React from 'react'
import { useAuth } from '@/context/AuthContext'

interface SidebarProps {
  currentTab: string
  onSelectTab: (tab: string) => void
}

export function Sidebar({ currentTab, onSelectTab }: SidebarProps) {
  const { user } = useAuth()
  const isAdmin = user?.role !== 'RESIDENT'

  const adminNav = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'admin-members', label: 'Directory & Members', icon: '👥' },
    { id: 'admin-units', label: 'Units & Occupancy', icon: '🏢' },
    { id: 'admin-billing', label: 'Billing & Invoices', icon: '💳' },
    { id: 'admin-complaints', label: 'Helpdesk & Tickets', icon: '🎫' },
    { id: 'admin-notices', label: 'Notices & Broadcast', icon: '📢' },
  ]

  const residentNav = [
    { id: 'resident-dashboard', label: 'My Flat Home', icon: '🏠' },
    { id: 'resident-bills', label: 'My Invoices & Pay', icon: '⚡' },
    { id: 'resident-complaints', label: 'Raise Ticket', icon: '🎫' },
    { id: 'resident-notices', label: 'Society Notice Board', icon: '📢' },
  ]

  const navItems = isAdmin ? adminNav : residentNav

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">R</div>
        <div className="brand-text">
          <div className="brand-name">RWA SaaS</div>
          <div className="brand-sub">Greenfield Heights</div>
        </div>
      </div>

      {/* Society Plan / Identity */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
            {isAdmin ? '👑 Admin View' : `🏠 Unit: ${user?.unitNumber || 'Resident'}`}
          </span>
          <span className="badge badge-blue" style={{ fontSize: 10 }}>
            {isAdmin ? 'SOCIETY' : 'SELF-SERVICE'}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="nav-menu" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="nav-section-label">MAIN NAVIGATION</div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{
                width: '100%',
                border: 'none',
                background: isActive ? 'var(--blue-light)' : 'transparent',
                color: isActive ? 'var(--blue)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 4,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 13 }}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User Quick Info */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--blue)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {user?.name?.[0] || 'U'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+91 {user?.phone}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
