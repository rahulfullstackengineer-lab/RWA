import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId!
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const category = searchParams.get('category') || undefined
    const unitIdParam = searchParams.get('unitId') || undefined

    const whereClause: any = { organizationId: orgId }
    if (status && status !== 'ALL') whereClause.status = status
    if (category && category !== 'ALL') whereClause.category = category

    if (unitIdParam && unitIdParam !== 'ALL') {
      whereClause.OR = [
        { unitId: unitIdParam },
        { raisedById: user.id },
        { unitId: null },
      ]
    } else if (user.role === 'RESIDENT' && !unitIdParam) {
      const orConditions: any[] = [
        { raisedById: user.id },
        { unitId: null },
      ]
      if (user.unitId) orConditions.push({ unitId: user.unitId })
      whereClause.OR = orConditions
    }

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        unit: { include: { block: true } },
        raisedBy: { select: { id: true, name: true, phone: true } },
        comments: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ complaints })
  } catch (err: unknown) {
    console.error('Error fetching complaints:', err)
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, description, category = 'MAINTENANCE', priority = 'MEDIUM', unitId = null, assignedTo = null } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const orgId = user.organizationId!
    const ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(3000 + Math.random() * 6000)}`

    // Determine target unit ID
    const finalUnitId = unitId || user.unitId || null

    const complaint = await prisma.complaint.create({
      data: {
        organizationId: orgId,
        unitId: finalUnitId,
        raisedById: user.id,
        ticketNumber,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: assignedTo ? 'IN_PROGRESS' : 'OPEN',
        assignedTo: assignedTo || null,
      },
      include: {
        unit: { include: { block: true } },
        raisedBy: { select: { id: true, name: true, phone: true } },
      },
    })

    // Emit live socket event
    emitLiveSocketEvent('new-complaint-ticket', {
      id: complaint.id,
      ticketNumber: complaint.ticketNumber,
      title: complaint.title,
      category: complaint.category,
      priority: complaint.priority,
      unitNumber: complaint.unit?.unitNumber || 'Common Area',
      raisedByName: user.name,
      createdAt: complaint.createdAt,
    }, { orgId })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'COMPLAINT_CREATED',
      entityType: 'Complaint',
      entityId: complaint.id,
      details: `Helpdesk ticket "${complaint.ticketNumber}: ${complaint.title}" raised (${complaint.category}, ${complaint.priority})`,
      severity: complaint.priority === 'URGENT' ? 'WARNING' : 'INFO',
      newValues: {
        ticketNumber: complaint.ticketNumber,
        title: complaint.title,
        unit: complaint.unit?.unitNumber || 'Common Area',
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, complaint })
  } catch (err: unknown) {
    console.error('Error creating complaint:', err)
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 })

    const orgId = user.organizationId!
    const complaint = await prisma.complaint.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })

    await prisma.complaint.delete({ where: { id } })

    emitLiveSocketEvent('complaint-deleted', { id }, { orgId })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'COMPLAINT_DELETED',
      entityType: 'Complaint',
      entityId: id,
      details: `Ticket "${complaint.ticketNumber}: ${complaint.title}" removed by admin`,
      severity: 'WARNING',
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, message: 'Ticket deleted' })
  } catch (err: unknown) {
    console.error('Error deleting complaint:', err)
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 })
  }
}
