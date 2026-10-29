'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'

interface HeaderProps {
  currentTab: string
  onToggleMobileNav?: () => void
  onSelectTab: (tab: string) => void
}

export function Header({ currentTab, onToggleMobileNav, onSelectTab }: HeaderProps) {
  const { user, switchPersona, logout } = useAuth()
  const { isConnected, unreadCount } = useSocket()
  const [showPersonaMenu, setShowPersonaMenu] = useState(false)
  const [showNotifDrawer, setShowNotifDrawer] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([])

  const loadNotifications = async () => {
    setShowNotifDrawer(!showNotifDrawer)
    if (!showNotifDrawer) {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
        }
      } catch {
        // ignore
      }
    }
  }

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const personas = [
    {
      label: '👑 Admin (President)',
      name: 'Vikram Malhotra',
      phone: '9876543210',
      role: 'RWA_ADMIN',
      badge: 'Admin Full Control',
    },
    {
      label: '🏠 Resident (Flat A-101)',
      name: 'Rohit Verma',
      phone: '9876543212',
      role: 'RESIDENT',
      badge: 'Due Bill: ₹5,030',
    },
    {
      label: '🏠 Resident (Flat B-204)',
      name: 'Ananya Gupta',
      phone: '9876543213',
      role: 'RESIDENT',
      badge: 'Paid Bill: ₹0 Due',
    },
  ]

  const formatTabName = (tab: string) => {
    return tab
      .replace('admin-', '')
      .replace('resident-', '')
      .replace('-', ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <header className="header" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="btn btn-ghost btn-icon show-on-mobile"
            style={{ fontSize: 18 }}
            aria-label="Toggle Menu"
          >
            ☰
          </button>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatTabName(currentTab)}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                background: isConnected ? '#ECFDF5' : '#FEF3C7',
                color: isConnected ? '#059669' : '#D97706',
                border: isConnected ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={isConnected ? 'Real-time WebSocket connected' : 'Connecting to socket...'}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isConnected ? '#059669' : '#D97706',
                }}
              />
              {isConnected ? 'Live Socket' : 'Reconnecting'}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Greenfield Heights RWA · Sector 48-C Chandigarh
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Fast Persona Switcher Pill */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              gap: 6,
              background: 'var(--bg-elevated)',
            }}
          >
            <span>{user?.role === 'RWA_ADMIN' ? '👑' : '🏠'}</span>
            <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Switch Role'}
            </span>
            <span style={{ fontSize: 10 }}>▼</span>
          </button>

          {showPersonaMenu && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                background: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.15)',
                width: 250,
                zIndex: 1000,
                padding: 6,
              }}
            >
              <div
                style={{
                  padding: '8px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid var(--border-light)',
                  marginBottom: 4,
                }}
              >
                Quick Switch Test Persona
              </div>

              {personas.map((p) => {
                const isCurrent = user?.phone === p.phone
                return (
                  <button
                    key={p.phone}
                    onClick={() => {
                      setShowPersonaMenu(false)
                      switchPersona(p.phone)
                      if (p.role === 'RWA_ADMIN') {
                        onSelectTab('admin-dashboard')
                      } else {
                        onSelectTab('resident-dashboard')
                      }
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: isCurrent ? 'var(--blue-light)' : 'transparent',
                      color: isCurrent ? 'var(--blue)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {p.name} · <span style={{ fontWeight: 600 }}>{p.badge}</span>
                    </div>
                  </button>
                )
              })}

              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 4, paddingTop: 4 }}>
                <button
                  onClick={() => {
                    setShowPersonaMenu(false)
                    logout()
                    onSelectTab('auth-login')
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--red)',
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  🚪 Logout / Test OTP Screen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={loadNotifications}
            className="btn btn-secondary btn-icon"
            style={{ position: 'relative' }}
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: 'var(--red)',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '1px 5px',
                  lineHeight: 1.2,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDrawer && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                background: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.15)',
                width: 320,
                maxHeight: 380,
                overflowY: 'auto',
                zIndex: 1000,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--border-light)',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--blue)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                  No recent notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: n.isRead ? 'transparent' : 'var(--bg-elevated)',
                      borderLeft: n.isRead ? 'none' : '3px solid var(--blue)',
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
