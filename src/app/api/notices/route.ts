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
    const type = searchParams.get('type') || undefined
    const statusParam = searchParams.get('status')

    const whereClause: any = { organizationId: orgId }
    if (type && type !== 'ALL') whereClause.type = type

    if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam
    } else if (user.role === 'RESIDENT') {
      whereClause.status = 'PUBLISHED'
    }

    const notices = await prisma.notice.findMany({
      where: whereClause,
      orderBy: [
        { pinnedUntil: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    const totalResidents = await prisma.user.count({
      where: { organizationId: orgId, status: 'ACTIVE' },
    })

    return NextResponse.json({ notices, totalResidents: totalResidents || 342 })
  } catch (err: unknown) {
    console.error('Error fetching notices:', err)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const {
      title,
      content,
      type = 'GENERAL',
      channels = 'IN_APP',
      status = 'PUBLISHED',
      pinned = false,
      pinnedUntil = null,
      attachmentUrl = null,
    } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const orgId = user.organizationId!
    const pinDate = pinned ? (pinnedUntil ? new Date(pinnedUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) : null

    const notice = await prisma.notice.create({
      data: {
        organizationId: orgId,
        title: title.trim(),
        content: content.trim(),
        type,
        channels,
        status,
        pinnedUntil: pinDate,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        publishedBy: `${user.name} (${user.role.replace('_', ' ')})`,
        attachmentUrl,
      },
    })

    if (status === 'PUBLISHED') {
      // Broadcast live notification to all users in the society via Socket.io
      emitLiveSocketEvent('new-notice', {
        id: notice.id,
        title: notice.title,
        content: notice.content,
        type: notice.type,
        publishedBy: notice.publishedBy,
        publishedAt: notice.publishedAt,
        pinned: !!notice.pinnedUntil,
      }, { orgId })

      // Create DB notifications for all members/residents of the society
      const societyUsers = await prisma.user.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      })

      if (societyUsers.length > 0) {
        const notifIcon = notice.type === 'ELECTION' ? '🗳️' : notice.type === 'MAINTENANCE' ? '🔧' : notice.type === 'EVENT' ? '🎉' : '📢'
        await prisma.notification.createMany({
          data: societyUsers.map((u) => ({
            organizationId: orgId,
            userId: u.id,
            title: `${notifIcon} New Society Notice: ${notice.title}`,
            message: notice.content.substring(0, 160) + (notice.content.length > 160 ? '...' : ''),
            type: 'NOTICE',
            referenceType: 'NOTICE',
            referenceId: notice.id,
          })),
        })
      }
    }

    // Log Immutable Audit Trail Event
    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: status === 'PUBLISHED' ? 'NOTICE_PUBLISHED' : 'NOTICE_DRAFTED',
      entityType: 'Notice',
      entityId: notice.id,
      details: `Circular notice "${notice.title}" created (${notice.type}, ${status})`,
      severity: 'INFO',
      newValues: {
        noticeId: notice.id,
        title: notice.title,
        type: notice.type,
        status: notice.status,
        channels: notice.channels,
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, notice })
  } catch (err: unknown) {
    console.error('Error creating notice:', err)
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, title, content, type, status, pinned, pinnedUntil, channels } = body
    if (!id) return NextResponse.json({ error: 'Notice ID required' }, { status: 400 })

    const orgId = user.organizationId!
    const existing = await prisma.notice.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!existing) return NextResponse.json({ error: 'Notice not found' }, { status: 404 })

    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (content !== undefined) updateData.content = content.trim()
    if (type !== undefined) updateData.type = type
    if (channels !== undefined) updateData.channels = channels
    if (status !== undefined) {
      updateData.status = status
      if (status === 'PUBLISHED' && !existing.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }
    if (pinned !== undefined) {
      updateData.pinnedUntil = pinned
        ? (pinnedUntil ? new Date(pinnedUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        : null
    }

    const updated = await prisma.notice.update({
      where: { id },
      data: updateData,
    })

    emitLiveSocketEvent('notice-updated', {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      type: updated.type,
      pinned: !!updated.pinnedUntil,
    }, { orgId })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'NOTICE_UPDATED',
      entityType: 'Notice',
      entityId: updated.id,
      details: `Notice "${updated.title}" modified (${JSON.stringify(updateData)})`,
      severity: 'INFO',
      oldValues: { title: existing.title, status: existing.status },
      newValues: updateData,
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, notice: updated })
  } catch (err: unknown) {
    console.error('Error updating notice:', err)
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Notice ID required' }, { status: 400 })

    const orgId = user.organizationId!
    const notice = await prisma.notice.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!notice) return NextResponse.json({ error: 'Notice not found' }, { status: 404 })

    await prisma.notice.delete({ where: { id } })

    emitLiveSocketEvent('notice-deleted', { id }, { orgId })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'NOTICE_DELETED',
      entityType: 'Notice',
      entityId: id,
      details: `Notice "${notice.title}" deleted by ${user.name}`,
      severity: 'WARNING',
      oldValues: { id: notice.id, title: notice.title },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, message: 'Notice deleted successfully' })
  } catch (err: unknown) {
    console.error('Error deleting notice:', err)
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 })
  }
}
