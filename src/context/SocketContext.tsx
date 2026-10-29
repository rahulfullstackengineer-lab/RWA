'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getSocketClient } from '@/lib/socket-client'
import { useAuth } from './AuthContext'

export interface ToastMessage {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert'
  timestamp: Date
}

interface SocketContextType {
  isConnected: boolean
  toasts: ToastMessage[]
  unreadCount: number
  dismissToast: (id: string) => void
  fetchUnreadCount: () => Promise<void>
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)

  const addToast = useCallback((title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastMessage = { id, title, message, type, timestamp: new Date() }
    setToasts((prev) => [newToast, ...prev].slice(0, 5))
    setUnreadCount((c) => c + 1)

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 6000)
  }, [])

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount, user])

  useEffect(() => {
    const socket = getSocketClient()

    function onConnect() {
      setIsConnected(true)
      if (user?.organizationId) {
        socket.emit('join-org', user.organizationId)
      }
      if (user?.id) {
        socket.emit('join-user', user.id)
      }
    }

    function onDisconnect() {
      setIsConnected(false)
    }

    if (socket.connected) {
      onConnect()
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    // Listen to real-time events
    socket.on('new-notice', (data: { title: string; content: string }) => {
      addToast(`📢 New Society Notice`, data.title, 'info')
    })

    socket.on('new-complaint-ticket', (data: { ticketNumber: string; title: string; unitNumber: string }) => {
      addToast(`🎫 New Ticket ${data.ticketNumber}`, `${data.unitNumber}: ${data.title}`, 'warning')
    })

    socket.on('complaint-status-updated', (data: { ticketNumber: string; newStatus: string }) => {
      addToast(`Ticket ${data.ticketNumber} Updated`, `Status changed to: ${data.newStatus}`, 'info')
    })

    socket.on('payment-confirmed', (data: { invoiceNumber: string; amount: number }) => {
      addToast(`Payment Confirmed! 🎉`, `₹${data.amount.toLocaleString('en-IN')} paid for ${data.invoiceNumber}`, 'success')
    })

    socket.on('new-payment-received', (data: { unitNumber: string; amount: number }) => {
      addToast(`💰 Payment Received`, `Flat ${data.unitNumber} paid ₹${data.amount.toLocaleString('en-IN')}`, 'success')
    })

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('new-notice')
      socket.off('new-complaint-ticket')
      socket.off('complaint-status-updated')
      socket.off('payment-confirmed')
      socket.off('new-payment-received')
    }
  }, [user, addToast])

  return (
    <SocketContext.Provider value={{ isConnected, toasts, unreadCount, dismissToast, fetchUnreadCount }}>
      {children}
      {/* Real-time Toast Notification Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 380,
          width: 'calc(100% - 40px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderLeft: `4px solid ${
                toast.type === 'success'
                  ? '#059669'
                  : toast.type === 'warning'
                  ? '#D97706'
                  : '#2563EB'
              }`,
              borderRadius: 8,
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
              padding: '12px 14px',
              animation: 'slideInRight 0.25s ease-out',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                {toast.title}
              </div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: 16,
                lineHeight: 1,
                padding: 2,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) throw new Error('useSocket must be used within a SocketProvider')
  return context
}
