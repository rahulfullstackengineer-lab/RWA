'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface AuthScreenProps {
  onSuccess: () => void
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const { loginWithPassword, loginWithOTP, requestOTP, switchPersona } = useAuth()
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('password')
  const [phone, setPhone] = useState('9876543210')
  const [password, setPassword] = useState('admin123')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await loginWithPassword(phone, password)
    setLoading(false)
    if (res.success) {
      onSuccess()
    } else {
      setError(res.error || 'Login failed')
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await requestOTP(phone)
    setLoading(false)
    if (res.success) {
      setOtpSent(true)
      if (res.devCode) {
        setDevCode(res.devCode)
        setOtpCode(res.devCode)
      }
    } else {
      setError(res.error || 'Failed to send OTP')
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await loginWithOTP(phone, otpCode)
    setLoading(false)
    if (res.success) {
      onSuccess()
    } else {
      setError(res.error || 'Invalid OTP code')
    }
  }

  return (
    <div className="auth-screen fade-in" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left hero */}
      <div className="auth-left" style={{ flex: 1, padding: '48px', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 440 }}>
          <div className="brand-icon" style={{ marginBottom: 20 }}>R</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.25, marginBottom: 16 }}>
            Modern Society Management SaaS
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
            End-to-end billing with Razorpay, real-time Socket notifications, automated maintenance reconciliations, and resident self-service.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '💳', text: 'Razorpay UPI & Card gateway integration' },
              { icon: '⚡', text: 'Live WebSockets for instant complaint updates & notices' },
              { icon: '📊', text: 'Automated batch invoice generation & accounting ledger' },
              { icon: '🏢', text: 'Complete resident directory and occupancy management' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="auth-right" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#fff' }}>
        <div style={{ maxWidth: 380, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="brand-icon" style={{ margin: '0 auto 12px' }}>R</div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Welcome to RWA SaaS</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Greenfield Heights · Sector 48-C</p>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', padding: 4, borderRadius: 8, marginBottom: 20 }}>
            <button
              onClick={() => {
                setAuthMode('password')
                setOtpSent(false)
                setError(null)
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: authMode === 'password' ? '#fff' : 'transparent',
                fontWeight: authMode === 'password' ? 700 : 500,
                color: authMode === 'password' ? 'var(--blue)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 12,
                boxShadow: authMode === 'password' ? 'var(--shadow-xs)' : 'none',
              }}
            >
              Password Login
            </button>
            <button
              onClick={() => {
                setAuthMode('otp')
                setError(null)
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: authMode === 'otp' ? '#fff' : 'transparent',
                fontWeight: authMode === 'otp' ? 700 : 500,
                color: authMode === 'otp' ? 'var(--blue)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 12,
                boxShadow: authMode === 'otp' ? 'var(--shadow-xs)' : 'none',
              }}
            >
              OTP Login
            </button>
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 6, background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', fontSize: 12, marginBottom: 14 }}>
              {error}
            </div>
          )}

          {authMode === 'password' ? (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Registered Phone Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
                style={{ justifyContent: 'center', padding: '12px', fontWeight: 700 }}
              >
                {loading ? 'Authenticating...' : 'Sign In →'}
              </button>
            </form>
          ) : !otpSent ? (
            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Mobile Number for OTP</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
                style={{ justifyContent: 'center', padding: '12px', fontWeight: 700 }}
              >
                {loading ? 'Sending OTP...' : 'Send 6-Digit OTP →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  OTP sent to <strong>+91 {phone}</strong>
                </div>
                {devCode && (
                  <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginTop: 4 }}>
                    Test Code: {devCode} (or use universal 123456)
                  </div>
                )}
              </div>

              <div>
                <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', textAlign: 'center', fontSize: 20, letterSpacing: '0.2em', fontFamily: 'monospace' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
                style={{ justifyContent: 'center', padding: '12px', fontWeight: 700 }}
              >
                {loading ? 'Verifying...' : 'Verify & Enter Portal →'}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--blue)' }}
              >
                ← Change Phone Number
              </button>
            </form>
          )}

          {/* Quick Demo Switcher Buttons */}
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
              Instant Demo Access
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                type="button"
                onClick={async () => {
                  await switchPersona('9876543210', 'admin123')
                  onSuccess()
                }}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', fontSize: 11 }}
              >
                <span>👑 President Admin (Vikram)</span>
                <span style={{ color: 'var(--blue)', fontWeight: 700 }}>9876543210</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await switchPersona('9876543212', 'resident123')
                  onSuccess()
                }}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', fontSize: 11 }}
              >
                <span>🏠 Resident Flat A-101 (Rohit - Due Bill)</span>
                <span style={{ color: 'var(--red)', fontWeight: 700 }}>₹5,030 Due</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await switchPersona('9876543213', 'resident123')
                  onSuccess()
                }}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', fontSize: 11 }}
              >
                <span>🏠 Resident Flat B-204 (Ananya - Paid)</span>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>₹0 Due</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
