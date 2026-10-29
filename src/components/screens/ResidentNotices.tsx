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

export function ResidentNotices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="content fade-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Society Notice Board</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Official communications, maintenance schedules, and AGM meeting circulars
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading notices...</div>
        ) : notices.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No notices posted</div>
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
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                {n.content}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: 8 }}>
                Issued by: <span style={{ fontWeight: 600 }}>{n.publishedBy || 'Society Management'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
