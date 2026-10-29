'use client'

import React, { useEffect, useState } from 'react'

interface Unit {
  id: string
  unitNumber: string
  unitType: string
  floor: number | null
  areaSqft: number | null
  occupancyStatus: string
  ownerName: string | null
  ownerPhone: string | null
  tenantName: string | null
  tenantPhone: string | null
  block: { id: string; name: string } | null
}

interface Block {
  id: string
  name: string
  description: string | null
}

export function AdminUnits() {
  const [units, setUnits] = useState<Unit[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState<string>('')
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const loadUnits = async () => {
    try {
      const url = selectedBlock ? `/api/units?blockId=${selectedBlock}` : '/api/units'
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setUnits(json.units || [])
        setBlocks(json.blocks || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUnits()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlock])

  const handleUpdateOccupant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUnit) return
    setIsUpdating(true)

    try {
      const res = await fetch('/api/units', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUnit.id,
          occupancyStatus: editingUnit.occupancyStatus,
          ownerName: editingUnit.ownerName,
          ownerPhone: editingUnit.ownerPhone,
          tenantName: editingUnit.tenantName,
          tenantPhone: editingUnit.tenantPhone,
        }),
      })

      if (res.ok) {
        setEditingUnit(null)
        loadUnits()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Units & Occupancy Management</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Tower-wise flats, ownership records, and tenant details
          </p>
        </div>
      </div>

      {/* Block Filter Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedBlock('')}
          className={`btn ${!selectedBlock ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          All Towers ({units.length})
        </button>
        {blocks.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBlock(b.id)}
            className={`btn ${selectedBlock === b.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Units Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Flat Number</th>
                <th>Tower / Block</th>
                <th>Type & Size</th>
                <th>Occupancy Status</th>
                <th>Current Occupant</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    Loading units...
                  </td>
                </tr>
              ) : (
                units.map((u) => {
                  const isTenant = u.occupancyStatus === 'TENANT_OCCUPIED'
                  const occupantName = isTenant ? u.tenantName : u.ownerName
                  const occupantPhone = isTenant ? u.tenantPhone : u.ownerPhone

                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 800, fontSize: 14 }}>{u.unitNumber}</td>
                      <td>{u.block?.name || 'General'}</td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{u.unitType.replace('_', ' ')}</div>
                        {u.areaSqft && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.areaSqft} sq.ft</div>}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.occupancyStatus === 'OWNER_OCCUPIED'
                              ? 'badge-green'
                              : u.occupancyStatus === 'TENANT_OCCUPIED'
                              ? 'badge-blue'
                              : 'badge-amber'
                          }`}
                        >
                          {u.occupancyStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{occupantName || 'Vacant / Unregistered'}</div>
                        {isTenant && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Owner: {u.ownerName}</div>}
                      </td>
                      <td>
                        {occupantPhone ? (
                          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>+91 {occupantPhone}</span>
                        ) : (
                          <span style={{ color: 'var(--text-disabled)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => setEditingUnit(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Occupant Modal */}
      {editingUnit && (
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
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Edit Flat {editingUnit.unitNumber}</h3>
              <button
                onClick={() => setEditingUnit(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateOccupant} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Occupancy Status</label>
                <select
                  value={editingUnit.occupancyStatus}
                  onChange={(e) => setEditingUnit({ ...editingUnit, occupancyStatus: e.target.value })}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="OWNER_OCCUPIED">Owner Occupied</option>
                  <option value="TENANT_OCCUPIED">Tenant Occupied</option>
                  <option value="VACANT">Vacant</option>
                </select>
              </div>

              <div>
                <label className="form-label">Owner Name</label>
                <input
                  type="text"
                  value={editingUnit.ownerName || ''}
                  onChange={(e) => setEditingUnit({ ...editingUnit, ownerName: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label">Owner Phone</label>
                <input
                  type="tel"
                  value={editingUnit.ownerPhone || ''}
                  onChange={(e) => setEditingUnit({ ...editingUnit, ownerPhone: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              {editingUnit.occupancyStatus === 'TENANT_OCCUPIED' && (
                <>
                  <div>
                    <label className="form-label">Tenant Name</label>
                    <input
                      type="text"
                      value={editingUnit.tenantName || ''}
                      onChange={(e) => setEditingUnit({ ...editingUnit, tenantName: e.target.value })}
                      className="form-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className="form-label">Tenant Phone</label>
                    <input
                      type="tel"
                      value={editingUnit.tenantPhone || ''}
                      onChange={(e) => setEditingUnit({ ...editingUnit, tenantPhone: e.target.value })}
                      className="form-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {isUpdating ? 'Saving...' : 'Update Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
