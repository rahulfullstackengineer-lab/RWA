'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Comment {
  id: string
  authorName: string
  authorRole: string
  content: string
  createdAt: string
}

interface Complaint {
  id: string
  ticketNumber: string
  title: string
  description: string
  category: string | null
  priority: string
  status: string
  assignedTo: string | null
  createdAt: string
  comments: Comment[]
}

export function ResidentComplaints() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('PLUMBING')
  const [priority, setPriority] = useState('MEDIUM')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentText, setCommentText] = useState('')

  const loadComplaints = async () => {
    try {
      const res = await fetch('/api/complaints')
      if (res.ok) {
        const json = await res.json()
        setComplaints(json.complaints || [])
        if (selectedTicket) {
          const updated = (json.complaints || []).find((c: Complaint) => c.id === selectedTicket.id)
          if (updated) setSelectedTicket(updated)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComplaints()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, priority }),
      })

      if (res.ok) {
        setShowModal(false)
        setTitle('')
        setDescription('')
        loadComplaints()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !commentText.trim()) return

    try {
      const res = await fetch(`/api/complaints/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      })

      if (res.ok) {
        setCommentText('')
        loadComplaints()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Helpdesk & Complaints</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Raise plumbing, electrical, lift, or civil maintenance requests for Flat {user?.unitNumber || 'A-101'}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
          + Raise New Ticket
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1fr' : '1fr', gap: 16 }}>
        {/* Ticket List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      Loading your tickets...
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      No tickets raised yet. Click &quot;+ Raise New Ticket&quot; to report an issue.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr
                      key={c.id}
                      style={{
                        background: selectedTicket?.id === c.id ? 'var(--blue-light)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedTicket(c)}
                    >
                      <td>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{c.ticketNumber}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-blue">{c.category || 'General'}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            c.status === 'RESOLVED'
                              ? 'badge-green'
                              : c.status === 'IN_PROGRESS'
                              ? 'badge-amber'
                              : 'badge-red'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTicket(c)
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                        >
                          View 💬
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Ticket Conversation Thread */}
        {selectedTicket && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                  {selectedTicket.ticketNumber}
                </span>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedTicket.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Status:{' '}
                  <span
                    className={`badge ${
                      selectedTicket.status === 'RESOLVED'
                        ? 'badge-green'
                        : selectedTicket.status === 'IN_PROGRESS'
                        ? 'badge-amber'
                        : 'badge-red'
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8, margin: '12px 0' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedTicket.description}
              </div>
            </div>

            {/* Conversation */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 220, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)' }}>
                RWA Response & Updates ({selectedTicket.comments?.length || 0})
              </div>
              {selectedTicket.comments?.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Awaiting review by RWA office. You can leave an additional note below.
                </div>
              ) : (
                selectedTicket.comments.map((cm) => (
                  <div
                    key={cm.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: cm.authorRole.includes('ADMIN') ? 'var(--blue-light)' : 'var(--bg-elevated)',
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {cm.authorRole.includes('ADMIN') ? `🛡️ ${cm.authorName} (Admin)` : cm.authorName}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cm.content}</div>
                  </div>
                ))
              )}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Reply or add details..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button type="submit" disabled={!commentText.trim()} className="btn btn-primary btn-sm">
                Send 💬
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Raise Ticket Modal */}
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
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Raise Maintenance Ticket</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Issue Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water seepage in kitchen ceiling"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="PLUMBING">Plumbing & Water Seepage</option>
                  <option value="ELECTRICAL">Electrical & Power Backup</option>
                  <option value="LIFT">Elevator / Lift Issues</option>
                  <option value="CARPENTRY">Carpentry & Common Gates</option>
                  <option value="SECURITY">Security & Parking Dispute</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="form-label">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="LOW">Low (Routine Check)</option>
                  <option value="MEDIUM">Medium (Needs visit today/tomorrow)</option>
                  <option value="HIGH">High (Urgent Attention)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Full Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe where the issue is, since when, and convenient technician visit timings..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
