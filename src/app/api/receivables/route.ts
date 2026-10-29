import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'

// In-memory persistent store for commercial contracts per organization (hydrated with realistic society data)
// In a full relational production system, this maps to CommercialLease / CommercialInvoice models.
interface CommercialContract {
  id: string
  organizationId: string
  title: string
  category: 'CELL_TOWER' | 'COMMERCIAL_SHOP' | 'ATM_KIOSK' | 'EV_CHARGING' | 'EVENT_SPACE' | 'HOARDING'
  lesseeName: string
  contactPerson: string
  contactPhone: string
  contactEmail: string
  gstin?: string
  monthlyRent: number
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME'
  securityDeposit: number
  agreementNumber: string
  startDate: string
  endDate: string
  unitOrLocation: string
  lastBilledMonth: string
  paymentStatus: 'PAID' | 'OVERDUE' | 'PENDING'
  lastPaidDate?: string
  lastPaidAmount?: number
  bankReference?: string
  tdsDeductedPercent?: number
  notes?: string
  createdAt: string
}

// Default commercial contracts template for societies
const DEFAULT_CONTRACTS: Record<string, CommercialContract[]> = {}

function getInitialContracts(orgId: string): CommercialContract[] {
  return []
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    let orgId = searchParams.get('orgId') || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || 'default_org'
    }

    if (!DEFAULT_CONTRACTS[orgId]) {
      DEFAULT_CONTRACTS[orgId] = getInitialContracts(orgId)
    }

    const contracts = DEFAULT_CONTRACTS[orgId]
    const categoryFilter = searchParams.get('category')
    const statusFilter = searchParams.get('status')

    let filtered = contracts
    if (categoryFilter && categoryFilter !== 'ALL') {
      filtered = filtered.filter(c => c.category === categoryFilter)
    }
    if (statusFilter && statusFilter !== 'ALL') {
      filtered = filtered.filter(c => c.paymentStatus === statusFilter)
    }

    // Calculate executive metrics
    const totalMonthlyRevenue = contracts.reduce((sum, c) => sum + (c.billingCycle === 'ONE_TIME' ? 0 : c.monthlyRent), 0)
    const totalAnnualRevenue = totalMonthlyRevenue * 12
    const totalDepositsHeld = contracts.reduce((sum, c) => sum + (c.securityDeposit || 0), 0)
    const overdueReceivables = contracts
      .filter(c => c.paymentStatus === 'OVERDUE')
      .reduce((sum, c) => sum + c.monthlyRent, 0)
    const pendingReceivables = contracts
      .filter(c => c.paymentStatus === 'PENDING')
      .reduce((sum, c) => sum + c.monthlyRent, 0)

    return NextResponse.json({
      success: true,
      orgId,
      contracts: filtered,
      totalCount: contracts.length,
      metrics: {
        totalMonthlyRevenue,
        totalAnnualRevenue,
        totalDepositsHeld,
        overdueReceivables,
        pendingReceivables,
        activeContractsCount: contracts.length,
        paidCount: contracts.filter(c => c.paymentStatus === 'PAID').length,
        overdueCount: contracts.filter(c => c.paymentStatus === 'OVERDUE').length,
        pendingCount: contracts.filter(c => c.paymentStatus === 'PENDING').length,
      },
    })
  } catch (err: unknown) {
    console.error('Receivables GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch external receivables' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const orgId = body.orgId || request.headers.get('x-active-org-id') || user.organizationId || 'default_org'

    if (!DEFAULT_CONTRACTS[orgId]) {
      DEFAULT_CONTRACTS[orgId] = getInitialContracts(orgId)
    }

    const newContract: CommercialContract = {
      id: `comm_${Date.now()}`,
      organizationId: orgId,
      title: body.title || 'New Commercial Lease',
      category: body.category || 'COMMERCIAL_SHOP',
      lesseeName: body.lesseeName || 'Lessee Name',
      contactPerson: body.contactPerson || '',
      contactPhone: body.contactPhone || '',
      contactEmail: body.contactEmail || '',
      gstin: body.gstin || '',
      monthlyRent: Number(body.monthlyRent || 0),
      billingCycle: body.billingCycle || 'MONTHLY',
      securityDeposit: Number(body.securityDeposit || 0),
      agreementNumber: body.agreementNumber || `AGR-${Date.now().toString().slice(-6)}`,
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      endDate: body.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      unitOrLocation: body.unitOrLocation || 'Commercial Space',
      lastBilledMonth: new Date().toISOString().slice(0, 7),
      paymentStatus: 'PENDING',
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
    }

    DEFAULT_CONTRACTS[orgId].unshift(newContract)

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'COMMERCIAL_LEASE_CREATED',
      entityType: 'CommercialContract',
      entityId: newContract.id,
      details: `Added new commercial contract: "${newContract.title}" for ₹${newContract.monthlyRent.toLocaleString('en-IN')}/mo to ${newContract.lesseeName}`,
      severity: 'INFO',
    }).catch(() => {})

    emitLiveSocketEvent('new-commercial-lease', newContract, { orgId })

    return NextResponse.json({ success: true, contract: newContract })
  } catch (err: unknown) {
    console.error('Receivables POST error:', err)
    return NextResponse.json({ error: 'Failed to create commercial contract' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, paymentStatus, lastPaidAmount, bankReference, notes } = body
    const orgId = body.orgId || request.headers.get('x-active-org-id') || user.organizationId || 'default_org'

    if (!DEFAULT_CONTRACTS[orgId]) {
      DEFAULT_CONTRACTS[orgId] = getInitialContracts(orgId)
    }

    const item = DEFAULT_CONTRACTS[orgId].find(c => c.id === id)
    if (!item) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (paymentStatus) item.paymentStatus = paymentStatus
    if (lastPaidAmount !== undefined) item.lastPaidAmount = Number(lastPaidAmount)
    if (bankReference !== undefined) item.bankReference = bankReference
    if (notes !== undefined) item.notes = notes
    if (paymentStatus === 'PAID') {
      item.lastPaidDate = new Date().toISOString().split('T')[0]
      if (!item.lastPaidAmount) item.lastPaidAmount = item.monthlyRent
    }

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'COMMERCIAL_PAYMENT_RECORDED',
      entityType: 'CommercialContract',
      entityId: item.id,
      details: `Commercial lease "${item.title}" marked as ${item.paymentStatus} (Amount: ₹${(item.lastPaidAmount || item.monthlyRent).toLocaleString('en-IN')})`,
      severity: 'INFO',
    }).catch(() => {})

    emitLiveSocketEvent('commercial-payment-updated', item, { orgId })

    return NextResponse.json({ success: true, contract: item })
  } catch (err: unknown) {
    console.error('Receivables PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update commercial contract' }, { status: 500 })
  }
}
