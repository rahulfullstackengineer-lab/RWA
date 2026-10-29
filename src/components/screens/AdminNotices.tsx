'use client'

import React, { useEffect, useState } from 'react'

interface Notice {
  id: string
  title: string
  content: string
  type: string
  publishedBy: string | null
  createdAt: string
}

export function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('GENERAL')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadNotices = async () => {
    try {
      const res = await fetch('/api/notices')
      if (res.ok) {
        const json = await res.json()
        setNotices(json.notices || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotices()
  }, [])

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type }),
      })

      if (res.ok) {
        setShowModal(false)
        setTitle('')
        setContent('')
        loadNotices()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Society Notices & Broadcasts</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Publish announcements with instant real-time Socket notification to all residents
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
          📢 + Publish Notice
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading notices...</div>
        ) : notices.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No notices published yet</div>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span className="badge badge-purple" style={{ marginRight: 8 }}>
                    {n.type}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                {n.content}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: 8 }}>
                Issued by: <span style={{ fontWeight: 600 }}>{n.publishedBy || 'Society Office'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Notice Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Publish Society Notice</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateNotice} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual General Meeting (AGM) 2026 Announcement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label">Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="GENERAL">General Announcement</option>
                  <option value="MAINTENANCE">Maintenance & Repairs</option>
                  <option value="MEETING">General Body / Committee Meeting</option>
                  <option value="EVENT">Cultural / Social Event</option>
                </select>
              </div>

              <div>
                <label className="form-label">Notice Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide full details, timings, venue, and instructions for residents..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {isSubmitting ? 'Broadcasting...' : '📢 Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
