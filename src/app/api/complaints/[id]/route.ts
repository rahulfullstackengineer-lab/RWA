import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Update status / assign technician
export async function PATCH(request: Request, context: RouteParams) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const body = await request.json()
    const { status, assignedTo, resolutionNote } = body

    const existing = await prisma.complaint.findUnique({
      where: { id },
      include: { raisedBy: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        assignedTo: assignedTo !== undefined ? assignedTo : undefined,
        resolutionNote: resolutionNote !== undefined ? resolutionNote : undefined,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      },
      include: {
        unit: true,
        raisedBy: { select: { id: true, name: true, phone: true } },
        comments: true,
      },
    })

    // Emit live socket event to the resident who raised the complaint
    emitLiveSocketEvent('complaint-status-updated', {
      complaintId: updated.id,
      ticketNumber: updated.ticketNumber,
      title: updated.title,
      newStatus: updated.status,
      assignedTo: updated.assignedTo,
      resolutionNote: updated.resolutionNote,
    }, { userId: existing.raisedById })

    // Also notify org room
    emitLiveSocketEvent('complaint-updated', {
      complaintId: updated.id,
      ticketNumber: updated.ticketNumber,
      status: updated.status,
    }, { orgId: existing.organizationId })

    return NextResponse.json({ success: true, complaint: updated })
  } catch (err: unknown) {
    console.error('Error updating complaint:', err)
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 })
  }
}

// Add comment to complaint
export async function POST(request: Request, context: RouteParams) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const comment = await prisma.complaintComment.create({
      data: {
        complaintId: id,
        authorName: user.name,
        authorRole: user.role,
        content: content.trim(),
      },
    })

    // Target socket recipient
    const targetUserId = user.id === complaint.raisedById ? undefined : complaint.raisedById

    emitLiveSocketEvent('new-complaint-comment', {
      complaintId: id,
      comment,
      ticketNumber: complaint.ticketNumber,
    }, targetUserId ? { userId: targetUserId } : { orgId: complaint.organizationId })

    return NextResponse.json({ success: true, comment })
  } catch (err: unknown) {
    console.error('Error adding comment:', err)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
