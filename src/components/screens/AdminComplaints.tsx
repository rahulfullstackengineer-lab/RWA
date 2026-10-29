'use client'

import React, { useEffect, useState } from 'react'

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
  unit: { unitNumber: string } | null
  raisedBy: { name: string; phone: string }
  comments: Comment[]
}

export function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isPostingComment, setIsPostingComment] = useState(false)

  const loadComplaints = async () => {
    try {
      const url = statusFilter ? `/api/complaints?status=${statusFilter}` : '/api/complaints'
      const res = await fetch(url)
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
  }, [statusFilter])

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/complaints/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        loadComplaints()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !commentText.trim()) return

    setIsPostingComment(true)
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
    } finally {
      setIsPostingComment(false)
    }
  }

  return (
    <div className="content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Helpdesk & Complaints</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Maintenance issues, plumbing, electrical, lift, and society complaints
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: '', label: 'All Tickets' },
          { id: 'OPEN', label: 'Open' },
          { id: 'IN_PROGRESS', label: 'In Progress' },
          { id: 'RESOLVED', label: 'Resolved' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`btn ${statusFilter === f.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1fr' : '1fr', gap: 16 }}>
        {/* Ticket List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Title & Flat</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      Loading tickets...
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      No complaints found
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
                          Flat {c.unit?.unitNumber || 'Common'} · {c.raisedBy?.name}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            c.priority === 'HIGH' ? 'badge-red' : c.priority === 'MEDIUM' ? 'badge-amber' : 'badge-blue'
                          }`}
                        >
                          {c.priority}
                        </span>
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

        {/* Selected Ticket Detail & Real-Time Comment Thread */}
        {selectedTicket && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                    {selectedTicket.ticketNumber}
                  </span>
                  <span className="badge badge-blue">{selectedTicket.category || 'General'}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedTicket.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Flat {selectedTicket.unit?.unitNumber} · Raised by {selectedTicket.raisedBy?.name} (+91{' '}
                  {selectedTicket.raisedBy?.phone})
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 8, margin: '12px 0' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedTicket.description}
              </div>
            </div>

            {/* Quick Status Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
              {(['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleUpdateStatus(selectedTicket.id, s)}
                  className={`btn btn-sm ${selectedTicket.status === s ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: 11 }}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Comment Thread */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 220, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)' }}>
                Activity & Responses ({selectedTicket.comments?.length || 0})
              </div>
              {selectedTicket.comments?.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No responses yet. Write an update below.
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
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cm.authorName}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cm.content}</div>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Type response to resident (live notification)..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={isPostingComment || !commentText.trim()}
                className="btn btn-primary btn-sm"
              >
                Send 🚀
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
