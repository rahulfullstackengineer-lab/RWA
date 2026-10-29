'use client'

import React, { useEffect, useState } from 'react'

interface Vehicle {
  id: string
  unitId: string
  type: string
  registrationNo: string
  make: string | null
  model: string | null
  color: string | null
  parkingSlot: string | null
  createdAt: string
  unit: {
    unitNumber: string
    ownerName: string | null
    ownerPhone: string | null
    tenantName: string | null
    tenantPhone: string | null
    block: { name: string } | null
  } | null
}

interface UnitOption {
  id: string
  unitNumber: string
  ownerName: string | null
  tenantName: string | null
  block: { name: string } | null
}

export function AdminVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [units, setUnits] = useState<UnitOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)

  // Form states
  const [unitId, setUnitId] = useState('')
  const [type, setType] = useState('CAR')
  const [registrationNo, setRegistrationNo] = useState('')
  const [parkingSlot, setParkingSlot] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [color, setColor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vehicles')
      if (res.ok) {
        const data = await res.json()
        setVehicles(data.vehicles || [])
      }
    } catch (e) {
      console.error('Failed to load vehicles:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadUnits = async () => {
    try {
      const res = await fetch('/api/units')
      if (res.ok) {
        const data = await res.json()
        setUnits(data.units || [])
      }
    } catch (e) {
      console.error('Failed to load units:', e)
    }
  }

  useEffect(() => {
    loadVehicles()
    loadUnits()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitId || !registrationNo.trim()) {
      setErrorMsg('Flat / Unit and Registration Number are required')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const isEditing = !!editVehicle
      const res = await fetch('/api/vehicles', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing ? { id: editVehicle.id } : {}),
          unitId,
          type,
          registrationNo: registrationNo.trim(),
          parkingSlot: parkingSlot.trim() || null,
          make: make.trim() || null,
          model: model.trim() || null,
          color: color.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Operation failed')
      }

      setShowAddModal(false)
      setEditVehicle(null)
      resetForm()
      loadVehicles()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save vehicle')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, reg: string) => {
    if (!confirm(`Are you sure you want to remove vehicle ${reg}?`)) return
    try {
      const res = await fetch(`/api/vehicles?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) {
        loadVehicles()
      }
    } catch (e) {
      console.error('Failed to delete vehicle:', e)
    }
  }

  const resetForm = () => {
    setUnitId('')
    setType('CAR')
    setRegistrationNo('')
    setParkingSlot('')
    setMake('')
    setModel('')
    setColor('')
    setErrorMsg(null)
  }

  const openEdit = (v: Vehicle) => {
    setEditVehicle(v)
    setUnitId(v.unitId)
    setType(v.type)
    setRegistrationNo(v.registrationNo)
    setParkingSlot(v.parkingSlot || '')
    setMake(v.make || '')
    setModel(v.model || '')
    setColor(v.color || '')
    setErrorMsg(null)
    setShowAddModal(true)
  }

  // Filtered list
  const filtered = vehicles.filter((v) => {
    const term = search.toLowerCase()
    const matchesSearch =
      !term ||
      v.registrationNo.toLowerCase().includes(term) ||
      (v.parkingSlot && v.parkingSlot.toLowerCase().includes(term)) ||
      (v.unit && v.unit.unitNumber.toLowerCase().includes(term)) ||
      (v.unit && v.unit.ownerName && v.unit.ownerName.toLowerCase().includes(term)) ||
      (v.make && v.make.toLowerCase().includes(term)) ||
      (v.model && v.model.toLowerCase().includes(term))

    if (!matchesSearch) return false

    if (filterType === 'CAR') return (v.type || '').toUpperCase() === 'CAR'
    if (filterType === 'BIKE') return ['BIKE', 'TWO_WHEELER', 'SCOOTER'].includes((v.type || '').toUpperCase())
    if (filterType === 'ALLOCATED') return v.parkingSlot && v.parkingSlot.trim() !== ''
    if (filterType === 'UNALLOCATED') return !v.parkingSlot || v.parkingSlot.trim() === ''
    return true
  })

  const totalCars = vehicles.filter((v) => (v.type || '').toUpperCase() === 'CAR').length
  const totalBikes = vehicles.filter((v) => ['BIKE', 'TWO_WHEELER', 'SCOOTER'].includes((v.type || '').toUpperCase())).length
  const allocatedSlots = vehicles.filter((v) => v.parkingSlot && v.parkingSlot.trim() !== '').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Vehicle Parking & RFID Directory</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
            Track authorized resident vehicles, visitor passes, and designated parking bays
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditVehicle(null)
            resetForm()
            setShowAddModal(true)
          }}
        >
          + Add Car / Parking
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid stat-grid-4">
        <div className="stat-card blue">
          <div className="stat-icon blue">🚗</div>
          <div className="stat-value">{vehicles.length}</div>
          <div className="stat-label">Total Vehicles</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple">🚙</div>
          <div className="stat-value">{totalCars}</div>
          <div className="stat-label">Four-Wheelers (Cars)</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber">🏍️</div>
          <div className="stat-value">{totalBikes}</div>
          <div className="stat-label">Two-Wheelers</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green">🅿️</div>
          <div className="stat-value">{allocatedSlots}</div>
          <div className="stat-label">Allocated Parking Bays</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by reg no, flat, owner, slot, make/model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['ALL', 'CAR', 'BIKE', 'ALLOCATED', 'UNALLOCATED'] as const).map((cat) => (
            <div
              key={cat}
              className={`filter-pill ${filterType === cat ? 'active' : ''}`}
              onClick={() => setFilterType(cat)}
            >
              {cat === 'ALL' && 'All'}
              {cat === 'CAR' && '🚗 Cars'}
              {cat === 'BIKE' && '🏍️ Two-Wheelers'}
              {cat === 'ALLOCATED' && '🅿️ Assigned Slots'}
              {cat === 'UNALLOCATED' && '⚠️ Unallocated'}
            </div>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadVehicles}>
          🔄 Refresh
        </button>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: 130 }}>Parking Slot</th>
                <th>Flat / Unit</th>
                <th>Owner / Resident</th>
                <th>Vehicle Type</th>
                <th>Registration No</th>
                <th>Model / Make</th>
                <th>RFID Status</th>
                <th style={{ textAlign: 'right', minWidth: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    Loading vehicles from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>🚗🅿️</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No Vehicles Registered</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                      {vehicles.length === 0
                        ? 'No resident cars or parking bays recorded in this society yet.'
                        : 'No vehicles match your search filter.'}
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditVehicle(null)
                        resetForm()
                        setShowAddModal(true)
                      }}
                    >
                      + Register Car & Parking Slot
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id}>
                    <td>
                      {v.parkingSlot && v.parkingSlot.trim() !== '' ? (
                        <span className="badge badge-blue" style={{ fontWeight: 800, fontSize: 12, padding: '4px 8px' }}>
                          🅿️ {v.parkingSlot}
                        </span>
                      ) : (
                        <span className="badge badge-amber" style={{ fontSize: 11 }}>
                          ⚠️ Unallocated
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {v.unit?.unitNumber || '—'}
                      {v.unit?.block?.name && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 'normal' }}>
                          {' '}
                          ({v.unit.block.name})
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.unit?.ownerName || v.unit?.tenantName || 'Resident'}</div>
                      {(v.unit?.ownerPhone || v.unit?.tenantPhone) && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {v.unit?.ownerPhone || v.unit?.tenantPhone}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {v.type === 'CAR' ? '🚗 Car' : v.type === 'BIKE' ? '🏍️ Bike' : `🚙 ${v.type}`}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          background: '#f8fafc',
                          border: '1.5px solid #0f172a',
                          borderRadius: 5,
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: 12,
                          letterSpacing: 0.8,
                          color: '#0f172a',
                        }}
                      >
                        {v.registrationNo}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {[v.make, v.model].filter(Boolean).join(' ') || '—'}
                      {v.color && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}> ({v.color})</span>}
                    </td>
                    <td>
                      <span className="badge badge-green" style={{ fontSize: 11 }}>
                        ✓ Active Tag
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: 11, marginRight: 6 }}
                        onClick={() => openEdit(v)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: 11, color: 'var(--red)' }}
                        onClick={() => handleDelete(v.id, v.registrationNo)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 540,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 800 }}>
                {editVehicle ? '✏️ Edit Vehicle & Parking Slot' : '🚗 Register Vehicle & Parking Slot'}
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 16,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {errorMsg && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 10, borderRadius: 8, fontSize: 13 }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                  Flat / Unit *
                </label>
                <select
                  className="form-select"
                  style={{ width: '100%', fontSize: 13 }}
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  required
                >
                  <option value="">-- Select Flat / Unit --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Flat {u.unitNumber} {u.block?.name ? `(${u.block.name})` : ''} — {u.ownerName || u.tenantName || 'Resident'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                    Vehicle Type *
                  </label>
                  <select
                    className="form-select"
                    style={{ width: '100%', fontSize: 13 }}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="CAR">🚗 Car (Four-Wheeler)</option>
                    <option value="BIKE">🏍️ Two-Wheeler (Bike/Scooter)</option>
                    <option value="EV">⚡ Electric Vehicle (EV)</option>
                    <option value="OTHER">🚐 Other Vehicle</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                    Parking Slot / Bay ID 🅿️
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. P-101, B1-14, Stilt-02"
                    style={{ width: '100%', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}
                    value={parkingSlot}
                    onChange={(e) => setParkingSlot(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                    Registration Plate No *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. CH-01-AB-1234"
                    style={{ width: '100%', fontSize: 13, fontWeight: 800, fontFamily: 'monospace', textTransform: 'uppercase' }}
                    value={registrationNo}
                    onChange={(e) => setRegistrationNo(e.target.value.toUpperCase())}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                    Color
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. White, Silver, Black"
                    style={{ width: '100%', fontSize: 13 }}
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                    Make / Brand
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hyundai, Honda, Tata"
                    style={{ width: '100%', fontSize: 13 }}
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                    Model
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Creta, City, Nexon"
                    style={{ width: '100%', fontSize: 13 }}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editVehicle ? 'Update Vehicle' : 'Save & Allocate Parking 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
