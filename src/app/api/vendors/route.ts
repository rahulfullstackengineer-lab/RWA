import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

const VENDORS_DATA_PATH = path.join(process.cwd(), 'vendors_store.json')

export interface VendorRecord {
  id: string
  name: string
  service: string
  phone: string
  contactPerson?: string
  email?: string
  gstin?: string
  type: 'AMC' | 'ON_CALL' | 'CONTRACT'
  status: 'ACTIVE' | 'INACTIVE'
  rating?: number
  activeContracts?: number
  address?: string
  createdAt: string
  updatedAt?: string
}

export interface ContractRecord {
  id: string
  title: string
  vendorId: string
  vendorName: string
  category: string
  monthlyAmount: number
  billingFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'RENEWED' | 'TERMINATED'
  slaDetails?: string
  contactPerson?: string
  contactPhone?: string
  autoRenew?: boolean
  notes?: string
  createdAt: string
  updatedAt?: string
}

function getDefaultVendors(): VendorRecord[] {
  return [
    {
      id: 'VND-001',
      name: 'Sharma Plumbers',
      service: 'Plumbing & Water Supply',
      phone: '+91 98123 45678',
      contactPerson: 'Manoj Sharma',
      email: 'sharma.plumbing@example.com',
      gstin: '04AABCS1234F1Z1',
      type: 'AMC',
      status: 'ACTIVE',
      rating: 4.8,
      activeContracts: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'VND-002',
      name: 'Apex Elevator Services (OTIS Lift AMC)',
      service: 'Elevator & Lift AMC',
      phone: '1800-200-4455',
      contactPerson: 'Karan Mehra',
      email: 'service@apexelevators.in',
      gstin: '07AAACT2940M1Z8',
      type: 'AMC',
      status: 'ACTIVE',
      rating: 4.9,
      activeContracts: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'VND-003',
      name: 'Ashok Electrical Works',
      service: 'Electrical & Transformers',
      phone: '+91 98200 11223',
      contactPerson: 'Ashok Verma',
      email: 'ashok.electricals@example.com',
      gstin: '03AABCP5678G1Z2',
      type: 'AMC',
      status: 'ACTIVE',
      rating: 4.7,
      activeContracts: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'VND-004',
      name: 'SkyGuard Security Solutions',
      service: 'Security & Gate Guarding',
      phone: '+91 98001 12345',
      contactPerson: 'Capt. R. S. Rathore',
      email: 'ops@skyguardsecurity.in',
      gstin: '04AAGCS9988D1Z9',
      type: 'CONTRACT',
      status: 'ACTIVE',
      rating: 4.6,
      activeContracts: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'VND-005',
      name: 'Clean & Care Facility Services',
      service: 'Housekeeping & Sanitation',
      phone: '+91 98004 45678',
      contactPerson: 'Sunita Devi',
      email: 'info@cleanandcare.co.in',
      type: 'CONTRACT',
      status: 'ACTIVE',
      rating: 4.5,
      activeContracts: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'VND-006',
      name: 'Green Thumb Landscaping',
      service: 'Horticulture & Lawn Maintenance',
      phone: '+91 98006 67890',
      contactPerson: 'Ram Swaroop',
      email: 'gardening@greenthumb.in',
      type: 'ON_CALL',
      status: 'ACTIVE',
      rating: 4.8,
      activeContracts: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]
}

function getDefaultContracts(): ContractRecord[] {
  return [
    {
      id: 'AMC-001',
      title: 'Society Security & Gate Guarding',
      vendorId: 'VND-004',
      vendorName: 'SkyGuard Security Solutions',
      category: 'Security & Gate Guarding',
      monthlyAmount: 42000,
      billingFrequency: 'MONTHLY',
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      status: 'ACTIVE',
      slaDetails: '24x7 gate & perimeter guarding, 3 security personnel per 8-hour shift, biometric visitor verification.',
      contactPerson: 'Capt. R. S. Rathore',
      contactPhone: '+91 98001 12345',
      autoRenew: true,
      createdAt: '2026-04-01T00:00:00.000Z',
    },
    {
      id: 'AMC-002',
      title: 'OTIS Passenger Lifts AMC (Blocks A & B)',
      vendorId: 'VND-002',
      vendorName: 'Apex Elevator Services (OTIS Lift AMC)',
      category: 'Elevator & Lift AMC',
      monthlyAmount: 8500,
      billingFrequency: 'MONTHLY',
      startDate: '2025-11-01',
      endDate: '2026-11-15',
      status: 'EXPIRING',
      slaDetails: 'Comprehensive breakdown coverage, monthly mechanical inspection, 30-min emergency entrapment response.',
      contactPerson: 'Karan Mehra',
      contactPhone: '1800-200-4455',
      autoRenew: false,
      createdAt: '2025-11-01T00:00:00.000Z',
    },
    {
      id: 'AMC-003',
      title: 'Full Society Daily Housekeeping',
      vendorId: 'VND-005',
      vendorName: 'Clean & Care Facility Services',
      category: 'Housekeeping & Sanitation',
      monthlyAmount: 22000,
      billingFrequency: 'MONTHLY',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'ACTIVE',
      slaDetails: 'Daily corridor, basement and lobby sweeping/mopping, garbage chute sanitization, weekly pressure washing.',
      contactPerson: 'Sunita Devi',
      contactPhone: '+91 98004 45678',
      autoRenew: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'AMC-004',
      title: 'Substation & Transformer Maintenance',
      vendorId: 'VND-003',
      vendorName: 'Ashok Electrical Works',
      category: 'Electrical & Transformers',
      monthlyAmount: 3200,
      billingFrequency: 'MONTHLY',
      startDate: '2026-06-01',
      endDate: '2027-05-31',
      status: 'ACTIVE',
      slaDetails: 'Bi-monthly transformer oil analysis, HT breaker servicing, diesel generator routine load testing.',
      contactPerson: 'Ashok Verma',
      contactPhone: '+91 98200 11223',
      autoRenew: false,
      createdAt: '2026-06-01T00:00:00.000Z',
    },
    {
      id: 'AMC-005',
      title: 'Commercial RO & STP Water Treatment AMC',
      vendorId: 'VND-001',
      vendorName: 'Sharma Plumbers',
      category: 'Plumbing & Water Supply',
      monthlyAmount: 5000,
      billingFrequency: 'MONTHLY',
      startDate: '2025-11-01',
      endDate: '2026-11-20',
      status: 'EXPIRING',
      slaDetails: 'Sewage treatment plant bacterial culture dosing, RO filter replacement, dual water pump health check.',
      contactPerson: 'Manoj Sharma',
      contactPhone: '+91 98123 45678',
      autoRenew: false,
      createdAt: '2025-11-01T00:00:00.000Z',
    },
  ]
}

function getStoredData(orgId: string): { vendors: VendorRecord[]; contracts: ContractRecord[] } {
  try {
    if (fs.existsSync(VENDORS_DATA_PATH)) {
      const allData = JSON.parse(fs.readFileSync(VENDORS_DATA_PATH, 'utf-8'))
      if (allData && allData[orgId]) {
        const orgEntry = allData[orgId]
        if (Array.isArray(orgEntry)) {
          return { vendors: orgEntry, contracts: [] }
        }
        return {
          vendors: Array.isArray(orgEntry.vendors) ? orgEntry.vendors : [],
          contracts: Array.isArray(orgEntry.contracts) ? orgEntry.contracts : [],
        }
      }
    }
  } catch (e) {
    console.error('Error reading vendors store:', e)
  }

  return {
    vendors: [],
    contracts: [],
  }
}

function saveStoredData(orgId: string, data: { vendors: VendorRecord[]; contracts: ContractRecord[] }) {
  try {
    let allData: any = {}
    if (fs.existsSync(VENDORS_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(VENDORS_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    allData[orgId] = {
      vendors: data.vendors,
      contracts: data.contracts,
    }
    fs.writeFileSync(VENDORS_DATA_PATH, JSON.stringify(allData, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving vendors store:', e)
  }
}

function computeLiveContractStatus(contract: ContractRecord): ContractRecord {
  if (contract.status === 'TERMINATED') return contract

  const today = new Date('2026-10-13T00:00:00.000Z') // Current society reference date
  const end = new Date(contract.endDate + 'T23:59:59.999Z')
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let newStatus: ContractRecord['status'] = 'ACTIVE'
  if (diffDays < 0) {
    newStatus = 'EXPIRED'
  } else if (diffDays <= 45) {
    newStatus = 'EXPIRING'
  } else {
    newStatus = 'ACTIVE'
  }

  return {
    ...contract,
    status: newStatus,
  }
}

function computeMetrics(vendors: VendorRecord[], contracts: ContractRecord[]) {
  const activeVendors = vendors.filter(v => v.status === 'ACTIVE').length
  const activeContractsList = contracts.filter(c => c.status === 'ACTIVE' || c.status === 'EXPIRING')
  const expiringList = contracts.filter(c => c.status === 'EXPIRING')
  const monthlyPayout = activeContractsList.reduce((sum, c) => sum + (Number(c.monthlyAmount) || 0), 0)

  return {
    totalVendors: vendors.length,
    activeVendors: activeVendors,
    totalContracts: contracts.length,
    activeContracts: activeContractsList.length,
    expiringContracts: expiringList.length,
    monthlyPayout: monthlyPayout,
    expiringList: expiringList.map(c => ({
      id: c.id,
      title: c.title,
      vendorName: c.vendorName,
      endDate: c.endDate,
    })),
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId!
    const data = getStoredData(orgId)

    // Dynamically update contracts with live status
    const updatedContracts = data.contracts.map(computeLiveContractStatus)

    // Synchronize vendor activeContracts count
    data.vendors.forEach(v => {
      v.activeContracts = updatedContracts.filter(c => c.vendorId === v.id && (c.status === 'ACTIVE' || c.status === 'EXPIRING')).length
    })

    const metrics = computeMetrics(data.vendors, updatedContracts)

    return NextResponse.json({
      vendors: data.vendors,
      contracts: updatedContracts,
      metrics,
      totalCount: data.vendors.length,
      activeCount: metrics.activeVendors,
    })
  } catch (err: unknown) {
    console.error('Error in GET /api/vendors:', err)
    return NextResponse.json({ error: 'Failed to fetch vendors and contracts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const body = await request.json()
    const { action = 'create_vendor' } = body

    const data = getStoredData(orgId)

    if (action === 'create_contract') {
      const {
        title,
        vendorId,
        category,
        monthlyAmount,
        billingFrequency = 'MONTHLY',
        startDate,
        endDate,
        slaDetails = '',
        contactPerson = '',
        contactPhone = '',
        autoRenew = false,
        notes = '',
      } = body

      if (!title || !vendorId || !monthlyAmount || !startDate || !endDate) {
        return NextResponse.json(
          { error: 'Contract title, vendor, monthly amount, start date, and end date are required' },
          { status: 400 }
        )
      }

      const vendor = data.vendors.find(v => v.id === vendorId)
      const vendorName = vendor ? vendor.name : (body.vendorName || 'Empanelled Vendor')

      const newContractId = `AMC-${Math.floor(100 + Math.random() * 900)}`
      const rawContract: ContractRecord = {
        id: newContractId,
        title: title.trim(),
        vendorId,
        vendorName,
        category: category || vendor?.service || 'General Maintenance',
        monthlyAmount: Number(monthlyAmount) || 0,
        billingFrequency,
        startDate,
        endDate,
        status: 'ACTIVE',
        slaDetails: slaDetails.trim(),
        contactPerson: contactPerson.trim() || vendor?.contactPerson || '',
        contactPhone: contactPhone.trim() || vendor?.phone || '',
        autoRenew: Boolean(autoRenew),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      }

      const liveContract = computeLiveContractStatus(rawContract)
      data.contracts.unshift(liveContract)

      // Update vendor contract count
      if (vendor) {
        vendor.activeContracts = (vendor.activeContracts || 0) + 1
      }

      saveStoredData(orgId, data)

      emitLiveSocketEvent('vendor-contract-added', { contract: liveContract }, { orgId })

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'VENDOR_CONTRACT_CREATED',
        entityType: 'VendorContract',
        entityId: liveContract.id,
        details: `AMC Agreement "${liveContract.title}" (₹${liveContract.monthlyAmount.toLocaleString('en-IN')}/mo) with ${liveContract.vendorName} created by ${user.name}`,
        severity: 'INFO',
        newValues: liveContract,
        ipAddress: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
      })

      return NextResponse.json({ success: true, contract: liveContract })
    }

    if (action === 'renew_contract') {
      const { contractId, newEndDate, revisedAmount, notes = '' } = body
      if (!contractId || !newEndDate) {
        return NextResponse.json({ error: 'Contract ID and new end date are required for renewal' }, { status: 400 })
      }

      const contract = data.contracts.find(c => c.id === contractId)
      if (!contract) {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
      }

      const oldContract = { ...contract }
      contract.endDate = newEndDate
      if (revisedAmount && Number(revisedAmount) > 0) {
        contract.monthlyAmount = Number(revisedAmount)
      }
      contract.status = 'ACTIVE'
      contract.updatedAt = new Date().toISOString()
      if (notes) {
        contract.notes = (contract.notes ? contract.notes + '\n' : '') + `[Renewed ${new Date().toLocaleDateString('en-IN')}]: ` + notes
      }

      saveStoredData(orgId, data)

      emitLiveSocketEvent('vendor-contract-renewed', { contract }, { orgId })

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'VENDOR_CONTRACT_RENEWED',
        entityType: 'VendorContract',
        entityId: contract.id,
        details: `AMC Agreement "${contract.title}" renewed through ${newEndDate} by ${user.name}`,
        severity: 'INFO',
        oldValues: oldContract,
        newValues: contract,
        ipAddress: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
      })

      return NextResponse.json({ success: true, contract })
    }

    // Default: create_vendor
    const {
      name,
      service,
      phone,
      contactPerson = '',
      email = '',
      gstin = '',
      type = 'ON_CALL',
      address = '',
    } = body

    if (!name || !service || !phone) {
      return NextResponse.json({ error: 'Vendor name, service category, and contact phone are required' }, { status: 400 })
    }

    const newId = `VND-${Math.floor(100 + Math.random() * 900)}`

    const newVendor: VendorRecord = {
      id: newId,
      name: name.trim(),
      service: service.trim(),
      phone: phone.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      gstin: gstin.trim().toUpperCase(),
      type: type || 'ON_CALL',
      status: 'ACTIVE',
      rating: 5.0,
      activeContracts: 0,
      address: address.trim(),
      createdAt: new Date().toISOString(),
    }

    data.vendors.unshift(newVendor)
    saveStoredData(orgId, data)

    emitLiveSocketEvent('vendor-added', { vendor: newVendor }, { orgId })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'VENDOR_CREATED',
      entityType: 'Vendor',
      entityId: newVendor.id,
      details: `Vendor / Technician "${newVendor.name}" (${newVendor.service}, ${newVendor.phone}) onboarded by ${user.name}`,
      severity: 'INFO',
      newValues: newVendor,
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, vendor: newVendor })
  } catch (err: unknown) {
    console.error('Error in POST /api/vendors:', err)
    return NextResponse.json({ error: 'Failed to process vendor request' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const body = await request.json()
    const { action = 'update_vendor' } = body

    const data = getStoredData(orgId)

    if (action === 'update_contract') {
      const { id, title, category, monthlyAmount, billingFrequency, startDate, endDate, slaDetails, status, autoRenew, notes } = body
      const contract = data.contracts.find(c => c.id === id)
      if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

      const oldValues = { ...contract }
      if (title !== undefined) contract.title = title.trim()
      if (category !== undefined) contract.category = category.trim()
      if (monthlyAmount !== undefined) contract.monthlyAmount = Number(monthlyAmount)
      if (billingFrequency !== undefined) contract.billingFrequency = billingFrequency
      if (startDate !== undefined) contract.startDate = startDate
      if (endDate !== undefined) contract.endDate = endDate
      if (slaDetails !== undefined) contract.slaDetails = slaDetails.trim()
      if (status !== undefined) contract.status = status
      if (autoRenew !== undefined) contract.autoRenew = Boolean(autoRenew)
      if (notes !== undefined) contract.notes = notes.trim()
      contract.updatedAt = new Date().toISOString()

      saveStoredData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'VENDOR_CONTRACT_UPDATED',
        entityType: 'VendorContract',
        entityId: contract.id,
        details: `Contract "${contract.title}" updated by ${user.name}`,
        severity: 'INFO',
        oldValues,
        newValues: contract,
      })

      return NextResponse.json({ success: true, contract })
    }

    // Default: update_vendor
    const { id, name, service, phone, contactPerson, email, gstin, type, status, rating, address } = body
    const vendor = data.vendors.find(v => v.id === id)
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const oldValues = { ...vendor }
    if (name !== undefined) vendor.name = name.trim()
    if (service !== undefined) vendor.service = service.trim()
    if (phone !== undefined) vendor.phone = phone.trim()
    if (contactPerson !== undefined) vendor.contactPerson = contactPerson.trim()
    if (email !== undefined) vendor.email = email.trim()
    if (gstin !== undefined) vendor.gstin = gstin.trim().toUpperCase()
    if (type !== undefined) vendor.type = type
    if (status !== undefined) vendor.status = status
    if (rating !== undefined) vendor.rating = Number(rating)
    if (address !== undefined) vendor.address = address.trim()
    vendor.updatedAt = new Date().toISOString()

    saveStoredData(orgId, data)

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'VENDOR_UPDATED',
      entityType: 'Vendor',
      entityId: vendor.id,
      details: `Vendor "${vendor.name}" details updated by ${user.name}`,
      severity: 'INFO',
      oldValues,
      newValues: vendor,
    })

    return NextResponse.json({ success: true, vendor })
  } catch (err: unknown) {
    console.error('Error in PATCH /api/vendors:', err)
    return NextResponse.json({ error: 'Failed to update vendor record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') || 'vendor'

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const data = getStoredData(orgId)

    if (type === 'contract' || id.startsWith('AMC-')) {
      const idx = data.contracts.findIndex(c => c.id === id)
      if (idx === -1) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

      const removed = data.contracts.splice(idx, 1)[0]
      saveStoredData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'VENDOR_CONTRACT_DELETED',
        entityType: 'VendorContract',
        entityId: removed.id,
        details: `AMC Agreement "${removed.title}" removed by ${user.name}`,
        severity: 'WARNING',
        oldValues: removed,
      })

      return NextResponse.json({ success: true, message: 'Contract deleted' })
    }

    const idx = data.vendors.findIndex(v => v.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const removed = data.vendors.splice(idx, 1)[0]
    saveStoredData(orgId, data)

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'VENDOR_DELETED',
      entityType: 'Vendor',
      entityId: removed.id,
      details: `Vendor "${removed.name}" removed by ${user.name}`,
      severity: 'WARNING',
      oldValues: removed,
    })

    return NextResponse.json({ success: true, message: 'Vendor deleted' })
  } catch (err: unknown) {
    console.error('Error in DELETE /api/vendors:', err)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}
