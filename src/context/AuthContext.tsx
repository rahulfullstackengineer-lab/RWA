'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface UserProfile {
  id: string
  name: string
  phone: string
  email?: string | null
  role: string
  organizationId: string
  organizationName?: string
  unitId?: string | null
  unitNumber?: string
  blockName?: string
}

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isLoading: boolean
  loginWithPassword: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithOTP: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>
  requestOTP: (phone: string) => Promise<{ success: boolean; devCode?: string; error?: string }>
  switchPersona: (phone: string, password?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Fetch session on initial load
  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser({
            id: data.user.id,
            name: data.user.name,
            phone: data.user.phone,
            email: data.user.email,
            role: data.user.role,
            organizationId: data.user.organizationId,
            organizationName: data.user.organization?.name,
            unitId: data.user.unitId,
            unitNumber: data.user.unit?.unitNumber,
            blockName: data.user.unit?.block?.name,
          })
        }
      } else {
        // Auto login as default admin for convenient testing if no session exists yet
        await autoLoginDefault()
      }
    } catch (e) {
      console.error('Session refresh error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const autoLoginDefault = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9876543210', password: 'admin123' }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setToken(data.token)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const loginWithPassword = async (phone: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' }
      }
      setUser(data.user)
      setToken(data.token)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: 'Network error during login' }
    }
  }

  const requestOTP = async (phone: string) => {
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'send' }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to send OTP' }
      }
      return { success: true, devCode: data.devCode }
    } catch (err: unknown) {
      return { success: false, error: 'Network error' }
    }
  }

  const loginWithOTP = async (phone: string, code: string) => {
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, action: 'verify' }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid OTP' }
      }
      setUser(data.user)
      setToken(data.token)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: 'Network error' }
    }
  }

  const switchPersona = async (phone: string, password = 'admin123') => {
    setIsLoading(true)
    try {
      // Try login with provided or fallback password
      let res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      if (!res.ok) {
        // Try resident password
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password: 'resident123' }),
        })
      }
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setToken(data.token)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      setToken(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithPassword,
        loginWithOTP,
        requestOTP,
        switchPersona,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
