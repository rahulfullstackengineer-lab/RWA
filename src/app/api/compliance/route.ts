import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

const COMPLIANCE_DATA_PATH = path.join(process.cwd(), 'compliance_store.json')

export interface ComplianceItem {
  id: string
  title: string
  category: 'Governance' | 'Finance' | 'Safety' | 'Legal' | 'Operations' | string
  authority: string
  dateStr: string // YYYY-MM-DD
  day: string
  month: string
  year: number
  status: 'DUE' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED'
  recurring: boolean
  recurrenceFreq?: 'YEARLY' | 'QUARTERLY' | 'MONTHLY' | 'NONE'
  penaltyRisk?: string
  desc: string
  responsibleRole?: string
  linkedDocId?: string
  completedAt?: string
  completedBy?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ComplianceStoreData {
  items: ComplianceItem[]
}

function getDefaultComplianceItems(): ComplianceItem[] {
  return [
    {
      id: 'CMP-001',
      title: 'AGM Meeting Notice Deadline',
      category: 'Governance',
      authority: 'Registrar of Societies',
      dateStr: '2026-10-15',
      day: '15',
      month: 'Oct',
      year: 2026,
      status: 'DUE',
      recurring: true,
      recurrenceFreq: 'YEARLY',
      penaltyRisk: 'Invalidation of AGM resolutions if 14-day statutory notice requirement is breached',
      desc: 'Issue mandatory 14-day advance notice with audited accounts and agenda to all members for Oct 29 AGM.',
      responsibleRole: 'General Secretary',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z'
    },
    {
      id: 'CMP-002',
      title: 'Elevator & Lift License Annual Inspection',
      category: 'Safety',
      authority: 'State Electrical Inspectorate',
      dateStr: '2026-10-18',
      day: '18',
      month: 'Oct',
      year: 2026,
      status: 'DUE',
      recurring: true,
      recurrenceFreq: 'YEARLY',
      penaltyRisk: 'Compulsory shutdown notice and risk of passenger elevator operational sealing',
      desc: 'Annual safety inspection of all 6 passenger lifts and emergency governor brakes by state electrical inspector.',
      responsibleRole: 'Estate Manager & Otis AMC',
      linkedDocId: 'DOC-014',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z'
    },
    {
      id: 'CMP-003',
      title: 'Overhead & Underground Water Tank Disinfection',
      category: 'Operations',
      authority: 'Public Health Department & Municipal Corp',
      dateStr: '2026-10-22',
      day: '22',
      month: 'Oct',
      year: 2026,
      status: 'DUE',
      recurring: true,
      recurrenceFreq: 'QUARTERLY',
      penaltyRisk: 'Health hazard citation and statutory notice under Public Health Hygiene bylaws',
      desc: 'Quarterly deep chemical scrubbing, ultraviolet treatment, and water potability lab test certificate.',
      responsibleRole: 'Maintenance Supervisor',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z'
    },
    {
      id: 'CMP-004',
      title: 'Annual General Meeting (AGM) Convention',
      category: 'Governance',
      authority: 'Societies Registration Act',
      dateStr: '2026-10-29',
      day: '29',
      month: 'Oct',
      year: 2026,
      status: 'UPCOMING',
      recurring: true,
      recurrenceFreq: 'YEARLY',
      penaltyRisk: 'Registrar show-cause notice and appointment of government administrator if delayed beyond 6 months',
      desc: 'Mandatory annual general body meeting per society constitution to approve audited accounts and elections.',
      responsibleRole: 'President & Managing Committee',
      linkedDocId: 'DOC-007',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z'
    },
    {
      id: 'CMP-005',
      title: 'Quarterly GST Return (GSTR-1 & GSTR-3B)',
      category: 'Finance',
      authority: 'GST Department / CBIC',
      dateStr: '2026-10-31',
      day: '31',
      month: 'Oct',
      year: 2026,
      status: 'UPCOMING',
      recurring: true,
      recurrenceFreq: 'QUARTERLY',
      penaltyRisk: 'Late fee of ₹50/day plus 18% per annum statutory interest on net tax liabilities',
      desc: 'File statutory GST returns for commercial rental receipts, clubhouse bookings, and telecom tower licenses.',
      responsibleRole: 'Treasurer & Tax CA',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z'
    },
    {
      id: 'CMP-006',
      title: 'Fire Safety Certificate & NOC Renewal',
      category: 'Safety',
      authority: 'Fire & Emergency Services Department',
      dateStr: '2026-11-15',
      day: '15',
      month: 'Nov',
      year: 2026,
      status: 'UPCOMING',
      recurring: true,
      recurrenceFreq: 'YEARLY',
      penaltyRisk: 'Revocation of building occupancy certificate and ₹50,000 spot fine',
      desc: 'Annual fire safety inspection, hydrant pressure test, and certificate renewal from Municipal Fire Officer.',
      responsibleRole: 'Safety Sub-committee',
      linkedDocId: 'DOC-016',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z'
    },
    {
      id: 'CMP-007',
      title: 'Annual Statutory Audit Completion FY 2025-26',
      category: 'Finance',
      authority: 'Chartered Accountant / Registrar',
      dateStr: '2026-12-31',
      day: '31',
      month: 'Dec',
      year: 2026,
      status: 'UPCOMING',
      recurring: true,
      recurrenceFreq: 'YEARLY',
      penaltyRisk: 'Freezing of association operational bank accounts by registrar order',
      desc: 'Complete statutory accounts audit by registered chartered accountant for FY 2025-26.',
      responsibleRole: 'Treasurer & Kapoor Associates CA',
      linkedDocId: 'DOC-010',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z'
    },
    {
      id: 'CMP-008',
      title: 'Annual Return Filing — Registrar of Societies',
      category: 'Legal',
      authority: 'Registrar of Societies, Chandigarh',
      dateStr: '2026-09-14',
      day: '14',
      month: 'Sep',
      year: 2026,
      status: 'OVERDUE',
      recurring: true,
      recurrenceFreq: 'YEARLY',
      penaltyRisk: 'Compounding penalty fee of ₹2,500 and society de-registration warning notice',
      desc: 'File annual statutory return with Registrar of Societies including audited balance sheet and managing committee roster.',
      responsibleRole: 'Secretary & Legal Advisor',
      linkedDocId: 'DOC-001',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-09-15T00:00:00.000Z'
    }
  ]
}

function getStoredComplianceData(orgId: string): ComplianceStoreData {
  try {
    if (fs.existsSync(COMPLIANCE_DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(COMPLIANCE_DATA_PATH, 'utf-8'))
      if (data && data[orgId] && Array.isArray(data[orgId].items)) {
        return data[orgId]
      }
    }
  } catch (e) {
    console.error('Error reading compliance store:', e)
  }

  return {
    items: []
  }
}

function saveComplianceData(orgId: string, data: ComplianceStoreData) {
  try {
    let allData: any = {}
    if (fs.existsSync(COMPLIANCE_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(COMPLIANCE_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    allData[orgId] = data
    fs.writeFileSync(COMPLIANCE_DATA_PATH, JSON.stringify(allData, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving compliance store:', e)
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId!
    const data = getStoredComplianceData(orgId)

    const url = new URL(request.url)
    const categoryFilter = url.searchParams.get('category') || 'All'
    const statusFilter = url.searchParams.get('status') || 'All'
    const search = (url.searchParams.get('search') || '').toLowerCase().trim()

    let items = [...data.items]

    // Sort items chronologically by date
    items.sort((a, b) => (a.dateStr || '').localeCompare(b.dateStr || ''))

    // Counts
    const dueCount = items.filter(i => i.status === 'DUE').length
    const upcomingCount = items.filter(i => i.status === 'UPCOMING').length
    const completedCount = items.filter(i => i.status === 'COMPLETED').length
    const overdueCount = items.filter(i => i.status === 'OVERDUE').length

    // Filter
    if (categoryFilter !== 'All') {
      items = items.filter(i => (i.category || '').toLowerCase() === categoryFilter.toLowerCase())
    }

    if (statusFilter !== 'All') {
      if (statusFilter === 'Overdue') {
        items = items.filter(i => i.status === 'OVERDUE')
      } else if (statusFilter === 'Due (30d)') {
        items = items.filter(i => i.status === 'DUE' || i.status === 'UPCOMING')
      } else if (statusFilter === 'Completed') {
        items = items.filter(i => i.status === 'COMPLETED')
      }
    }

    if (search) {
      items = items.filter(i =>
        i.title.toLowerCase().includes(search) ||
        (i.desc && i.desc.toLowerCase().includes(search)) ||
        (i.authority && i.authority.toLowerCase().includes(search)) ||
        (i.category && i.category.toLowerCase().includes(search)) ||
        (i.penaltyRisk && i.penaltyRisk.toLowerCase().includes(search))
      )
    }

    return NextResponse.json({
      items,
      allItems: data.items,
      stats: {
        total: data.items.length,
        dueCount,
        upcomingCount,
        completedCount,
        overdueCount
      }
    })
  } catch (err: unknown) {
    console.error('Compliance GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch compliance deadlines' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { action = 'CREATE' } = body
    const orgId = user.organizationId!
    const data = getStoredComplianceData(orgId)

    if (action === 'CREATE') {
      const {
        title,
        dateVal,
        category = 'Governance',
        authority = 'Statutory Authority',
        status = 'UPCOMING',
        recurring = false,
        recurrenceFreq = 'NONE',
        penaltyRisk = '',
        desc = '',
        responsibleRole = 'Managing Committee',
        linkedDocId = null
      } = body

      if (!title || !dateVal) {
        return NextResponse.json({ error: 'Title and Due Date are required' }, { status: 400 })
      }

      const d = new Date(dateVal + 'T00:00:00')
      const day = String(d.getDate())
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const month = monthNames[d.getMonth()]
      const year = d.getFullYear()

      const newItem: ComplianceItem = {
        id: `CMP-${Date.now().toString().slice(-6)}`,
        title: title.trim(),
        category,
        authority: authority.trim(),
        dateStr: dateVal,
        day,
        month,
        year,
        status: status || 'UPCOMING',
        recurring: Boolean(recurring),
        recurrenceFreq: recurrenceFreq || (recurring ? 'YEARLY' : 'NONE'),
        penaltyRisk: penaltyRisk.trim(),
        desc: desc.trim() || 'Mandatory society compliance item.',
        responsibleRole: responsibleRole.trim(),
        linkedDocId: linkedDocId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      data.items.unshift(newItem)
      saveComplianceData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'CREATE_COMPLIANCE_TASK',
        entityType: 'ComplianceItem',
        entityId: newItem.id,
        details: `Created compliance deadline: "${newItem.title}" due ${newItem.dateStr} (${newItem.category})`,
      })

      emitLiveSocketEvent('compliance_updated', { item: newItem })
      return NextResponse.json({ success: true, item: newItem })
    }

    if (action === 'RESET_DEFAULTS') {
      data.items = getDefaultComplianceItems()
      saveComplianceData(orgId, data)
      return NextResponse.json({ success: true, items: data.items })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Compliance POST error:', err)
    return NextResponse.json({ error: 'Failed to create compliance task' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, action = 'UPDATE' } = body
    if (!id) return NextResponse.json({ error: 'Compliance ID is required' }, { status: 400 })

    const orgId = user.organizationId!
    const data = getStoredComplianceData(orgId)
    const itemIndex = data.items.findIndex(i => i.id === id)

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Compliance item not found' }, { status: 404 })
    }

    const item = data.items[itemIndex]

    if (action === 'MARK_DONE') {
      const { notes = '' } = body
      item.status = 'COMPLETED'
      item.completedAt = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      item.completedBy = user.name || 'Managing Committee'
      if (notes) item.notes = notes.trim()
      item.updatedAt = new Date().toISOString()

      saveComplianceData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'COMPLETE_COMPLIANCE_TASK',
        entityType: 'ComplianceItem',
        entityId: item.id,
        details: `Marked compliance task "${item.title}" as COMPLETED`,
      })

      emitLiveSocketEvent('compliance_updated', { item })
      return NextResponse.json({ success: true, item })
    }

    // Default UPDATE
    const {
      title,
      dateVal,
      category,
      authority,
      status,
      recurring,
      recurrenceFreq,
      penaltyRisk,
      desc,
      responsibleRole,
      linkedDocId,
      notes
    } = body

    if (title) item.title = title.trim()
    if (category) item.category = category
    if (authority) item.authority = authority.trim()
    if (status) item.status = status
    if (recurring !== undefined) item.recurring = Boolean(recurring)
    if (recurrenceFreq) item.recurrenceFreq = recurrenceFreq
    if (penaltyRisk !== undefined) item.penaltyRisk = penaltyRisk.trim()
    if (desc !== undefined) item.desc = desc.trim()
    if (responsibleRole !== undefined) item.responsibleRole = responsibleRole.trim()
    if (linkedDocId !== undefined) item.linkedDocId = linkedDocId || null
    if (notes !== undefined) item.notes = notes.trim()

    if (dateVal) {
      item.dateStr = dateVal
      const d = new Date(dateVal + 'T00:00:00')
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      item.day = String(d.getDate())
      item.month = monthNames[d.getMonth()]
      item.year = d.getFullYear()
    }

    item.updatedAt = new Date().toISOString()
    saveComplianceData(orgId, data)

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'UPDATE_COMPLIANCE_TASK',
      entityType: 'ComplianceItem',
      entityId: item.id,
      details: `Updated compliance task "${item.title}"`,
    })

    emitLiveSocketEvent('compliance_updated', { item })
    return NextResponse.json({ success: true, item })
  } catch (err: unknown) {
    console.error('Compliance PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update compliance task' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const url = new URL(request.url)
    let id = url.searchParams.get('id')
    if (!id) {
      try {
        const body = await request.json()
        id = body.id
      } catch {}
    }

    if (!id) return NextResponse.json({ error: 'Compliance ID is required' }, { status: 400 })

    const orgId = user.organizationId!
    const data = getStoredComplianceData(orgId)
    const itemIndex = data.items.findIndex(i => i.id === id)

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Compliance item not found' }, { status: 404 })
    }

    const removed = data.items.splice(itemIndex, 1)[0]
    saveComplianceData(orgId, data)

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'DELETE_COMPLIANCE_TASK',
      entityType: 'ComplianceItem',
      entityId: removed.id,
      details: `Deleted compliance task "${removed.title}"`,
      severity: 'WARNING'
    })

    emitLiveSocketEvent('compliance_deleted', { id: removed.id })
    return NextResponse.json({ success: true, deleted: removed })
  } catch (err: unknown) {
    console.error('Compliance DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete compliance task' }, { status: 500 })
  }
}
