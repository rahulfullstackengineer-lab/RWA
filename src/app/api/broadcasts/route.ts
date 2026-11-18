import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

const BROADCAST_DATA_PATH = path.join(process.cwd(), 'broadcasts_store.json')

function getStoredBroadcasts(orgId: string): any[] {
  try {
    if (fs.existsSync(BROADCAST_DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(BROADCAST_DATA_PATH, 'utf-8'))
      if (data && data[orgId]) return data[orgId]
    }
  } catch (e) {
    console.error('Error reading broadcasts store:', e)
  }

  return []
}

function fillBroadcast(template: string, values: Record<string, string>) {
  return template.replace(/\{([a-z_]+)\}/gi, (token, key) => {
    const value = values[String(key).toLowerCase()]
    return value == null || value === '' ? token : value
  })
}

function saveBroadcasts(orgId: string, broadcasts: any[]) {
  try {
    let allData: any = {}
    if (fs.existsSync(BROADCAST_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(BROADCAST_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    allData[orgId] = broadcasts
    fs.writeFileSync(BROADCAST_DATA_PATH, JSON.stringify(allData, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving broadcasts store:', e)
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    if (!user.organizationId) return NextResponse.json({ broadcasts: [], stats: { totalBroadcasts: 0, totalSent: 0, totalDelivered: 0, totalRead: 0, totalFailed: 0, deliveryRate: 0 } })
    const orgId = user.organizationId
    const broadcasts = getStoredBroadcasts(orgId)

    // Calculate live KPI stats
    const totalSent = broadcasts.reduce((acc, b) => acc + (b.sent || 0), 0)
    const totalDelivered = broadcasts.reduce((acc, b) => acc + (b.delivered || 0), 0)
    const totalRead = broadcasts.reduce((acc, b) => acc + (b.read || 0), 0)
    const totalFailed = broadcasts.reduce((acc, b) => acc + (b.failed || 0), 0)
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0

    return NextResponse.json({
      broadcasts,
      stats: {
        totalBroadcasts: broadcasts.length,
        totalSent,
        totalDelivered,
        totalRead,
        totalFailed,
        deliveryRate,
      },
    })
  } catch (err: unknown) {
    console.error('Error in GET /api/broadcasts:', err)
    return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const body = await request.json()
    const {
      title,
      message,
      audience = 'ALL_RESIDENTS',
      channels = ['In-App'],
      priority = 'NORMAL',
      scheduledAt = null,
    } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    // Determine targeted recipient cohort
    let targetUsers: any[] = []
    let audienceLabel = 'All Residents'

    if (audience === 'DEFAULTERS_ONLY') {
      audienceLabel = 'Defaulters Only'
      // Fetch users with unpaid invoices
      const unpaidInvoices = await prisma.invoice.findMany({
        where: { organizationId: orgId, balanceAmount: { gt: 0 } },
        select: { unitId: true },
      })
      const unitIds = Array.from(new Set(unpaidInvoices.map((inv) => inv.unitId)))
      targetUsers = await prisma.user.findMany({
        where: { organizationId: orgId, unitId: { in: unitIds }, status: 'ACTIVE' },
        select: { id: true, name: true, phone: true, unitId: true, unit: { select: { unitNumber: true } } },
      })
      audienceLabel = `Defaulters Only (${targetUsers.length})`
    } else if (audience === 'OWNERS_ONLY') {
      audienceLabel = 'Flat Owners Only'
      const ownerUnits = await prisma.unit.findMany({
        where: { organizationId: orgId, occupancyStatus: 'OWNER_OCCUPIED' },
        select: { id: true },
      })
      const unitIds = ownerUnits.map((u) => u.id)
      targetUsers = await prisma.user.findMany({
        where: { organizationId: orgId, unitId: { in: unitIds }, status: 'ACTIVE' },
        select: { id: true, name: true, phone: true, unitId: true, unit: { select: { unitNumber: true } } },
      })
      audienceLabel = `Owners Only (${targetUsers.length})`
    } else if (audience === 'TENANTS_ONLY') {
      const tenantUnits = await prisma.unit.findMany({
        where: { organizationId: orgId, occupancyStatus: { in: ['TENANT_OCCUPIED', 'TENANTED'] } },
        select: { id: true },
      })
      const unitIds = tenantUnits.map((u) => u.id)
      targetUsers = await prisma.user.findMany({
        where: { organizationId: orgId, unitId: { in: unitIds }, status: 'ACTIVE' },
        select: { id: true, name: true, phone: true, unitId: true, unit: { select: { unitNumber: true } } },
      })
      audienceLabel = `Tenants Only (${targetUsers.length})`
    } else if (audience === 'BLOCK_A') {
      audienceLabel = 'Block A Residents'
      const blockA = await prisma.block.findFirst({
        where: { organizationId: orgId, name: { contains: 'A' } },
        include: { units: { select: { id: true } } },
      })
      const unitIds = blockA?.units.map((u) => u.id) || []
      targetUsers = await prisma.user.findMany({
        where: { organizationId: orgId, unitId: { in: unitIds }, status: 'ACTIVE' },
        select: { id: true, name: true, phone: true, unitId: true, unit: { select: { unitNumber: true } } },
      })
      audienceLabel = `Block A Residents (${targetUsers.length})`
    } else {
      // ALL_RESIDENTS
      targetUsers = await prisma.user.findMany({
        where: { organizationId: orgId, status: 'ACTIVE' },
        select: { id: true, name: true, phone: true, unitId: true, unit: { select: { unitNumber: true } } },
      })
      audienceLabel = `All Residents (${targetUsers.length})`
    }

    const sentCount = targetUsers.length
    const deliveredCount = sentCount
    const failedCount = 0
    const payLink = `${new URL(request.url).origin}/#resident-bills`
    const dueRows = await prisma.invoice.groupBy({
      by: ['unitId'],
      where: { organizationId: orgId, balanceAmount: { gt: 0 }, status: { notIn: ['CANCELLED', 'VOID', 'DRAFT'] } },
      _sum: { balanceAmount: true },
    })
    const dueByUnit = new Map(dueRows.map((row) => [row.unitId, row._sum.balanceAmount || 0]))

    if ((channels.includes('In-App') || channels.includes('IN_APP')) && targetUsers.length > 0) {
      const personal = targetUsers.map((person) => {
        const due = person.unitId ? (dueByUnit.get(person.unitId) || 0) : 0
        const dueText = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: due % 1 === 0 ? 0 : 2,
        }).format(due)
        const filled = fillBroadcast(message, {
          resident_name: person.name || 'Resident',
          unit_number: person.unit?.unitNumber || 'not linked',
          due_amount: dueText,
          pay_link: payLink,
        })
        return { userId: person.id, message: filled }
      })

      await prisma.notification.createMany({
        data: personal.map((row) => ({
          organizationId: orgId,
          userId: row.userId,
          title: `📡 ${title}`,
          message: row.message,
          type: priority === 'URGENT' ? 'ALERT' : 'INFO',
          referenceType: 'BROADCAST',
        })),
      })

      for (const row of personal) {
        emitLiveSocketEvent('new-broadcast', {
          title: `📡 ${title}`,
          message: row.message,
          type: priority === 'URGENT' ? 'ALERT' : 'INFO',
        }, { userId: row.userId })
      }
    }

    // Save into broadcast history store
    const broadcasts = getStoredBroadcasts(orgId)
    const newBroadcast = {
      id: `BC-${Date.now().toString().slice(-4)}`,
      title,
      message,
      audience,
      audienceLabel,
      channels,
      sent: sentCount,
      delivered: deliveredCount,
      read: 0,
      failed: failedCount,
      status: scheduledAt ? 'SCHEDULED' : 'DELIVERED',
      scheduledAt: scheduledAt || null,
      sentAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      senderName: `${user.name} (${user.role.replace('_', ' ')})`,
    }

    broadcasts.unshift(newBroadcast)
    saveBroadcasts(orgId, broadcasts)

    // Log Immutable Audit Trail Event
    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'BROADCAST_SENT',
      entityType: 'Broadcast',
      entityId: newBroadcast.id,
      details: `Broadcast "${title}" dispatched to ${audienceLabel} via ${channels.join(', ')}`,
      severity: priority === 'URGENT' ? 'WARNING' : 'INFO',
      newValues: {
        broadcastId: newBroadcast.id,
        title,
        audience: audienceLabel,
        channels,
        sent: sentCount,
        delivered: deliveredCount,
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({
      success: true,
      broadcast: newBroadcast,
      recipientCount: sentCount,
      deliveredCount,
    })
  } catch (err: unknown) {
    console.error('Error in POST /api/broadcasts:', err)
    return NextResponse.json({ error: 'Failed to dispatch broadcast' }, { status: 500 })
  }
}
