'use client'

import React from 'react'
import { useAuth } from '@/context/AuthContext'

interface MobileNavProps {
  currentTab: string
  onSelectTab: (tab: string) => void
}

export function MobileNav({ currentTab, onSelectTab }: MobileNavProps) {
  const { user } = useAuth()
  const isAdmin = user?.role !== 'RESIDENT'

  const adminNav = [
    { id: 'admin-dashboard', label: 'Home', icon: '📊' },
    { id: 'admin-members', label: 'Members', icon: '👥' },
    { id: 'admin-units', label: 'Units', icon: '🏢' },
    { id: 'admin-billing', label: 'Billing', icon: '💳' },
    { id: 'admin-complaints', label: 'Tickets', icon: '🎫' },
  ]

  const residentNav = [
    { id: 'resident-dashboard', label: 'Home', icon: '🏠' },
    { id: 'resident-bills', label: 'Bills', icon: '⚡' },
    { id: 'resident-complaints', label: 'Tickets', icon: '🎫' },
    { id: 'resident-notices', label: 'Notices', icon: '📢' },
  ]

  const navItems = isAdmin ? adminNav : residentNav

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
