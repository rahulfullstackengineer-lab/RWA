import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

const ASSETS_DATA_PATH = path.join(process.cwd(), 'assets_store.json')

export interface ServiceLogRecord {
  id: string
  assetId: string
  serviceDate: string
  serviceType: 'ROUTINE' | 'REPAIR' | 'BREAKDOWN' | 'OVERHAUL' | 'INSPECTION'
  performedBy: string
  cost: number
  notes: string
  partsReplaced?: string
  nextServiceDate?: string
  loggedBy: string
  createdAt: string
}

export interface AssetRecord {
  id: string
  name: string
  category: 'Lift' | 'Generator' | 'Security' | 'Plumbing' | 'Safety' | 'Electrical' | 'General'
  status: 'ACTIVE' | 'UNDER_REPAIR' | 'STANDBY' | 'DECOMMISSIONED'
  serialNumber: string
  location: string
  purchaseValue: number
  purchaseDate: string
  warrantyExpiry?: string
  amcCovered: boolean
  vendorName?: string
  nextServiceDate: string
  lastServiceDate?: string
  notes?: string
  serviceLogs?: ServiceLogRecord[]
  createdAt: string
  updatedAt?: string
}

function getDefaultAssets(): AssetRecord[] {
  return [
    {
      id: 'AST-001',
      name: 'Passenger Lift — Block A',
      category: 'Lift',
      status: 'UNDER_REPAIR',
      serialNumber: 'LFT-A-001',
      location: 'Block A Tower (Cores 1 & 2)',
      purchaseValue: 1200000,
      purchaseDate: '2015-01-15',
      amcCovered: true,
      vendorName: 'Apex Elevator Services (OTIS Lift AMC)',
      nextServiceDate: '2026-10-18',
      lastServiceDate: '2026-10-04',
      serviceLogs: [
        {
          id: 'LOG-001',
          assetId: 'AST-001',
          serviceDate: '2026-10-04',
          serviceType: 'BREAKDOWN',
          performedBy: 'Apex Elevator Services',
          cost: 4500,
          notes: 'Levelling sensor diagnostic on 4th floor; spare unit ordered under warranty.',
          partsReplaced: 'Optical floor leveller sensor',
          nextServiceDate: '2026-10-18',
          loggedBy: 'Administrator',
          createdAt: '2026-10-04T11:00:00.000Z',
        },
        {
          id: 'LOG-002',
          assetId: 'AST-001',
          serviceDate: '2026-08-10',
          serviceType: 'ROUTINE',
          performedBy: 'Apex Elevator Services',
          cost: 0,
          notes: 'Routine bi-monthly lubrication, door operator tensioning, and brake clearance check.',
          nextServiceDate: '2026-10-04',
          loggedBy: 'Administrator',
          createdAt: '2026-08-10T09:30:00.000Z',
        },
      ],
      createdAt: '2015-01-15T00:00:00.000Z',
    },
    {
      id: 'AST-002',
      name: 'Passenger Lift — Block B',
      category: 'Lift',
      status: 'ACTIVE',
      serialNumber: 'LFT-B-001',
      location: 'Block B Tower (Cores 1 & 2)',
      purchaseValue: 1200000,
      purchaseDate: '2015-01-15',
      amcCovered: true,
      vendorName: 'Apex Elevator Services (OTIS Lift AMC)',
      nextServiceDate: '2026-12-15',
      lastServiceDate: '2026-09-15',
      serviceLogs: [
        {
          id: 'LOG-003',
          assetId: 'AST-002',
          serviceDate: '2026-09-15',
          serviceType: 'ROUTINE',
          performedBy: 'Apex Elevator Services',
          cost: 0,
          notes: 'Quarterly governor wire testing, counterweight alignment verification.',
          nextServiceDate: '2026-12-15',
          loggedBy: 'Administrator',
          createdAt: '2026-09-15T10:00:00.000Z',
        },
      ],
      createdAt: '2015-01-15T00:00:00.000Z',
    },
    {
      id: 'AST-003',
      name: 'DG Set (62.5 KVA Backup Generator)',
      category: 'Generator',
      status: 'ACTIVE',
      serialNumber: 'GEN-KIRL-001',
      location: 'DG Room, Basement Substation',
      purchaseValue: 420000,
      purchaseDate: '2018-03-20',
      amcCovered: true,
      vendorName: 'Ashok Electrical Works',
      nextServiceDate: '2026-11-20',
      lastServiceDate: '2026-09-20',
      serviceLogs: [
        {
          id: 'LOG-004',
          assetId: 'AST-003',
          serviceDate: '2026-09-20',
          serviceType: 'ROUTINE',
          performedBy: 'Ashok Electrical Works',
          cost: 3200,
          notes: 'Diesel engine oil filter replacement, battery water top-up, 30-minute load testing.',
          partsReplaced: 'Lube oil filter, 15W40 Engine Oil',
          nextServiceDate: '2026-11-20',
          loggedBy: 'Administrator',
          createdAt: '2026-09-20T14:00:00.000Z',
        },
      ],
      createdAt: '2018-03-20T00:00:00.000Z',
    },
    {
      id: 'AST-004',
      name: 'CCTV Surveillance System (32 IP Cameras & NVR)',
      category: 'Security',
      status: 'ACTIVE',
      serialNumber: 'CCTV-CPPLUS-32',
      location: 'Security Control Room, Gate 1',
      purchaseValue: 180000,
      purchaseDate: '2022-08-10',
      amcCovered: true,
      vendorName: 'SkyGuard Security Solutions',
      nextServiceDate: '2027-08-10',
      lastServiceDate: '2026-08-10',
      serviceLogs: [
        {
          id: 'LOG-005',
          assetId: 'AST-004',
          serviceDate: '2026-08-10',
          serviceType: 'INSPECTION',
          performedBy: 'SkyGuard Security Solutions',
          cost: 0,
          notes: 'Annual lens cleaning, angle adjustments, NVR 4TB hard drive SMART health check.',
          nextServiceDate: '2027-08-10',
          loggedBy: 'Administrator',
          createdAt: '2026-08-10T12:00:00.000Z',
        },
      ],
      createdAt: '2022-08-10T00:00:00.000Z',
    },
    {
      id: 'AST-005',
      name: 'Dual Booster Water Pump — Overhead',
      category: 'Plumbing',
      status: 'ACTIVE',
      serialNumber: 'PUMP-KIRL-OH-01',
      location: 'Terrace Pump House, Block C',
      purchaseValue: 85000,
      purchaseDate: '2019-06-10',
      amcCovered: true,
      vendorName: 'Sharma Plumbers',
      nextServiceDate: '2026-12-10',
      lastServiceDate: '2026-06-10',
      serviceLogs: [
        {
          id: 'LOG-006',
          assetId: 'AST-005',
          serviceDate: '2026-06-10',
          serviceType: 'ROUTINE',
          performedBy: 'Sharma Plumbers',
          cost: 1500,
          notes: 'Impeller seal replacement and vibration damper inspection.',
          partsReplaced: 'Mechanical water seal kit',
          nextServiceDate: '2026-12-10',
          loggedBy: 'Administrator',
          createdAt: '2026-06-10T16:00:00.000Z',
        },
      ],
      createdAt: '2019-06-10T00:00:00.000Z',
    },
    {
      id: 'AST-006',
      name: 'Fire Fighting System & Sprinkler Manifold',
      category: 'Safety',
      status: 'ACTIVE',
      serialNumber: 'FF-SAFEX-2020',
      location: 'Pump House & All Floor Risers',
      purchaseValue: 240000,
      purchaseDate: '2020-11-05',
      amcCovered: true,
      vendorName: 'Sharma Plumbers',
      nextServiceDate: '2026-11-05',
      lastServiceDate: '2026-05-05',
      serviceLogs: [
        {
          id: 'LOG-007',
          assetId: 'AST-006',
          serviceDate: '2026-05-05',
          serviceType: 'INSPECTION',
          performedBy: 'Fire Safety Inspectorate',
          cost: 2500,
          notes: 'Pressure gauge calibration, jockey pump auto-start test at 7.5 kg/cm² threshold.',
          nextServiceDate: '2026-11-05',
          loggedBy: 'Administrator',
          createdAt: '2026-05-05T11:30:00.000Z',
        },
      ],
      createdAt: '2020-11-05T00:00:00.000Z',
    },
  ]
}

function getStoredAssets(orgId: string): AssetRecord[] {
  try {
    if (fs.existsSync(ASSETS_DATA_PATH)) {
      const allData = JSON.parse(fs.readFileSync(ASSETS_DATA_PATH, 'utf-8'))
      if (allData && allData[orgId]) {
        return Array.isArray(allData[orgId]) ? allData[orgId] : []
      }
    }
  } catch (e) {
    console.error('Error reading assets store:', e)
  }

  return []
}

function saveStoredAssets(orgId: string, assets: AssetRecord[]) {
  try {
    let allData: any = {}
    if (fs.existsSync(ASSETS_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(ASSETS_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    allData[orgId] = assets
    fs.writeFileSync(ASSETS_DATA_PATH, JSON.stringify(allData, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving assets store:', e)
  }
}

function calculateAssetMetrics(assets: AssetRecord[]) {
  const activeCount = assets.filter(a => a.status === 'ACTIVE').length
  const underRepairCount = assets.filter(a => a.status === 'UNDER_REPAIR').length
  const totalValue = assets.reduce((sum, a) => sum + (Number(a.purchaseValue) || 0), 0)

  const today = new Date('2026-10-13T00:00:00.000Z')
  const serviceDueSoon = assets.filter(a => {
    if (!a.nextServiceDate) return false
    const d = new Date(a.nextServiceDate)
    const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 30
  }).length

  return {
    totalAssets: assets.length,
    activeCount,
    underRepairCount,
    totalCapitalValue: totalValue,
    serviceDueSoonCount: serviceDueSoon,
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId!
    const assets = getStoredAssets(orgId)
    const metrics = calculateAssetMetrics(assets)

    return NextResponse.json({
      assets,
      metrics,
    })
  } catch (err: unknown) {
    console.error('Error in GET /api/assets:', err)
    return NextResponse.json({ error: 'Failed to fetch society assets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const body = await request.json()
    const { action = 'create_asset' } = body

    const assets = getStoredAssets(orgId)

    if (action === 'log_service') {
      const {
        assetId,
        serviceDate = new Date().toISOString().split('T')[0],
        serviceType = 'ROUTINE',
        performedBy = 'Empanelled Vendor',
        cost = 0,
        notes = '',
        partsReplaced = '',
        nextServiceDate,
      } = body

      if (!assetId) {
        return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })
      }

      const asset = assets.find(a => a.id === assetId)
      if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      }

      const newLogId = `LOG-${Math.floor(100 + Math.random() * 900)}`
      const serviceLog: ServiceLogRecord = {
        id: newLogId,
        assetId: asset.id,
        serviceDate,
        serviceType,
        performedBy: performedBy.trim(),
        cost: Number(cost) || 0,
        notes: notes.trim(),
        partsReplaced: partsReplaced.trim(),
        nextServiceDate,
        loggedBy: user.name || 'Admin',
        createdAt: new Date().toISOString(),
      }

      if (!Array.isArray(asset.serviceLogs)) asset.serviceLogs = []
      asset.serviceLogs.unshift(serviceLog)
      asset.lastServiceDate = serviceDate
      if (nextServiceDate) asset.nextServiceDate = nextServiceDate
      if (asset.status === 'UNDER_REPAIR') asset.status = 'ACTIVE'
      asset.updatedAt = new Date().toISOString()

      saveStoredAssets(orgId, assets)

      emitLiveSocketEvent('asset-serviced', { asset, serviceLog }, { orgId })

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'ASSET_SERVICED',
        entityType: 'Asset',
        entityId: asset.id,
        details: `${serviceType} service logged for "${asset.name}" (Cost: ₹${cost}) by ${user.name}`,
        severity: 'INFO',
        newValues: serviceLog,
        ipAddress: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
      })

      return NextResponse.json({ success: true, serviceLog, asset })
    }

    // Default: create_asset
    const {
      name,
      category = 'General',
      serialNumber = '',
      location = '',
      purchaseValue = 0,
      purchaseDate = '2026-01-01',
      amcCovered = false,
      vendorName = '',
      nextServiceDate = '2026-12-01',
      status = 'ACTIVE',
      notes = '',
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Asset name is required' }, { status: 400 })
    }

    const newAssetId = `AST-${Math.floor(100 + Math.random() * 900)}`

    const newAsset: AssetRecord = {
      id: newAssetId,
      name: name.trim(),
      category: category || 'General',
      status: status || 'ACTIVE',
      serialNumber: serialNumber.trim() || `SN-${Date.now().toString().slice(-4)}`,
      location: location.trim() || 'Common Area',
      purchaseValue: Number(purchaseValue) || 0,
      purchaseDate: purchaseDate || '2026-01-01',
      amcCovered: Boolean(amcCovered),
      vendorName: vendorName.trim(),
      nextServiceDate: nextServiceDate || '2026-12-01',
      notes: notes.trim(),
      serviceLogs: [],
      createdAt: new Date().toISOString(),
    }

    assets.unshift(newAsset)
    saveStoredAssets(orgId, assets)

    emitLiveSocketEvent('asset-added', { asset: newAsset }, { orgId })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'ASSET_CREATED',
      entityType: 'Asset',
      entityId: newAsset.id,
      details: `Asset "${newAsset.name}" (${newAsset.category}, ₹${newAsset.purchaseValue}) added to asset register by ${user.name}`,
      severity: 'INFO',
      newValues: newAsset,
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, asset: newAsset })
  } catch (err: unknown) {
    console.error('Error in POST /api/assets:', err)
    return NextResponse.json({ error: 'Failed to process asset' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const body = await request.json()
    const { id, name, category, status, serialNumber, location, purchaseValue, nextServiceDate, amcCovered, vendorName, notes } = body

    if (!id) return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })

    const assets = getStoredAssets(orgId)
    const asset = assets.find(a => a.id === id)
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    const oldValues = { ...asset }
    if (name !== undefined) asset.name = name.trim()
    if (category !== undefined) asset.category = category
    if (status !== undefined) asset.status = status
    if (serialNumber !== undefined) asset.serialNumber = serialNumber.trim()
    if (location !== undefined) asset.location = location.trim()
    if (purchaseValue !== undefined) asset.purchaseValue = Number(purchaseValue)
    if (nextServiceDate !== undefined) asset.nextServiceDate = nextServiceDate
    if (amcCovered !== undefined) asset.amcCovered = Boolean(amcCovered)
    if (vendorName !== undefined) asset.vendorName = vendorName.trim()
    if (notes !== undefined) asset.notes = notes.trim()
    asset.updatedAt = new Date().toISOString()

    saveStoredAssets(orgId, assets)

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'ASSET_UPDATED',
      entityType: 'Asset',
      entityId: asset.id,
      details: `Asset "${asset.name}" updated by ${user.name}`,
      severity: 'INFO',
      oldValues,
      newValues: asset,
    })

    return NextResponse.json({ success: true, asset })
  } catch (err: unknown) {
    console.error('Error in PATCH /api/assets:', err)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })

    const assets = getStoredAssets(orgId)
    const idx = assets.findIndex(a => a.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    const removed = assets.splice(idx, 1)[0]
    saveStoredAssets(orgId, assets)

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'ASSET_DELETED',
      entityType: 'Asset',
      entityId: removed.id,
      details: `Asset "${removed.name}" (${removed.serialNumber}) deleted by ${user.name}`,
      severity: 'WARNING',
      oldValues: removed,
    })

    return NextResponse.json({ success: true, message: 'Asset removed' })
  } catch (err: unknown) {
    console.error('Error in DELETE /api/assets:', err)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
