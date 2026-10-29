import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    // Auto-sync / backfill any resident onboarding notifications for society admins
    const isAdmin = user.role !== 'RESIDENT' || ['RWA_ADMIN', 'ADMIN', 'MANAGER', 'SECRETARY', 'TREASURER', 'PRESIDENT', 'COMMITTEE_MEMBER', 'PLATFORM_ADMIN', 'PLATFORM_SUPER_ADMIN'].includes(user.role)
    if (isAdmin) {
      try {
        const orgFilter = user.organizationId ? { organizationId: user.organizationId } : {}

        // 1. Find residents linked to flats
        const connectedResidents = await prisma.user.findMany({
          where: {
            role: 'RESIDENT',
            unitId: { not: null },
            ...orgFilter,
          },
          include: {
            unit: { include: { block: true } },
            organization: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 30,
        })

        // 2. Find units with owner/tenant populated
        const occupiedUnits = await prisma.unit.findMany({
          where: {
            ...orgFilter,
            OR: [
              { ownerName: { not: null } },
              { tenantName: { not: null } },
            ],
          },
          include: { block: true, organization: true },
          orderBy: { updatedAt: 'desc' },
          take: 30,
        })

        const candidates = new Map<string, {
          name: string
          phone?: string | null
          unitNumber: string
          blockName: string
          unitId: string
          orgId: string
          isTenant: boolean
          date: Date
        }>()

        for (const r of connectedResidents) {
          if (r.unit) {
            const isTenant = r.unit.occupancyStatus === 'TENANTED' || r.unit.tenantPhone === r.phone
            candidates.set(r.unit.id, {
              name: r.name,
              phone: r.phone,
              unitNumber: r.unit.unitNumber,
              blockName: r.unit.block?.name || 'Main Block',
              unitId: r.unit.id,
              orgId: r.organizationId || user.organizationId || r.unit.organizationId,
              isTenant,
              date: r.updatedAt || r.createdAt,
            })
          }
        }

        for (const u of occupiedUnits) {
          if (!candidates.has(u.id)) {
            const resName = u.tenantName || u.ownerName || 'Resident'
            const resPhone = u.tenantPhone || u.ownerPhone || null
            const isTenant = !!u.tenantName
            candidates.set(u.id, {
              name: resName,
              phone: resPhone,
              unitNumber: u.unitNumber,
              blockName: u.block?.name || 'Main Block',
              unitId: u.id,
              orgId: u.organizationId,
              isTenant,
              date: u.updatedAt || new Date(),
            })
          }
        }

        // Check and create missing notifications
        for (const [unitId, cand] of candidates.entries()) {
          const existing = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: 'RESIDENT_ONBOARDED',
              referenceId: unitId,
            },
          })

          if (!existing) {
            const roleStr = cand.isTenant ? 'Tenant' : 'Flat Owner'
            const phoneStr = cand.phone ? ` (+91 ${cand.phone})` : ''
            await prisma.notification.create({
              data: {
                organizationId: cand.orgId,
                userId: user.id,
                title: '👤 New Resident Added to Property Structure',
                message: `Resident ${cand.name}${phoneStr} has joined and connected to Unit ${cand.unitNumber} (${cand.blockName}) as ${roleStr}.`,
                type: 'RESIDENT_ONBOARDED',
                referenceType: 'UNIT',
                referenceId: cand.unitId,
                createdAt: cand.date,
                isRead: false,
              },
            }).catch(() => {})
          }
        }
      } catch (backfillErr) {
        console.warn('Notification sync error in GET /api/notifications:', backfillErr)
      }
    }

    // Auto-sync published Society Notices and Polls so circulars are never missed by residents or admins
    if (user.organizationId) {
      try {
        // 1. Published Society Notices
        const publishedNotices = await prisma.notice.findMany({
          where: {
            organizationId: user.organizationId,
            status: 'PUBLISHED',
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })

        if (publishedNotices.length > 0) {
          const existingNoticeNotifs = await prisma.notification.findMany({
            where: {
              userId: user.id,
              referenceType: 'NOTICE',
              referenceId: { in: publishedNotices.map((n) => n.id) },
            },
            select: { referenceId: true },
          })
          const existingNoticeIds = new Set(existingNoticeNotifs.map((n) => n.referenceId))
          const missingNotices = publishedNotices.filter((n) => !existingNoticeIds.has(n.id))

          for (const n of missingNotices) {
            const icon = n.type === 'ELECTION' ? '🗳️' : n.type === 'MAINTENANCE' ? '🔧' : n.type === 'EVENT' ? '🎉' : '📢'
            await prisma.notification.create({
              data: {
                organizationId: user.organizationId,
                userId: user.id,
                title: `${icon} ${n.title}`,
                message: n.content.substring(0, 160) + (n.content.length > 160 ? '...' : ''),
                type: 'NOTICE',
                referenceType: 'NOTICE',
                referenceId: n.id,
                createdAt: n.publishedAt || n.createdAt,
                isRead: false,
              },
            }).catch(() => {})
          }
        }

        // 2. Active Democratic Polls
        const activePolls = (prisma as any).poll?.findMany
          ? await (prisma as any).poll.findMany({
              where: {
                organizationId: user.organizationId,
                status: 'ACTIVE',
              },
              orderBy: { createdAt: 'desc' },
              take: 15,
            }).catch(() => [])
          : []

        if (activePolls && activePolls.length > 0) {
          const existingPollNotifs = await prisma.notification.findMany({
            where: {
              userId: user.id,
              referenceType: 'POLL',
              referenceId: { in: activePolls.map((p: any) => p.id) },
            },
            select: { referenceId: true },
          })
          const existingPollIds = new Set(existingPollNotifs.map((p: any) => p.referenceId))
          const missingPolls = activePolls.filter((p: any) => !existingPollIds.has(p.id))

          for (const p of missingPolls) {
            await prisma.notification.create({
              data: {
                organizationId: user.organizationId,
                userId: user.id,
                title: `🗳️ Active Society Poll: ${p.question}`,
                message: p.description || 'Your democratic vote is requested by the society managing committee.',
                type: 'POLL',
                referenceType: 'POLL',
                referenceId: p.id,
                createdAt: p.createdAt,
                isRead: false,
              },
            }).catch(() => {})
          }
        }
      } catch (noticeSyncErr) {
        console.warn('Notice & poll sync warning in GET /api/notifications:', noticeSyncErr)
      }
    }

    const whereClause = user.organizationId
      ? {
          OR: [
            { userId: user.id },
            {
              organizationId: user.organizationId,
              type: { in: ['NOTICE', 'POLL', 'BROADCAST', 'GENERAL', 'MEETING', 'MAINTENANCE'] },
            },
          ],
        }
      : { userId: user.id }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { ...whereClause, isRead: false },
      }),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (err: unknown) {
    console.error('Error fetching notifications:', err)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const isAdmin = user.role !== 'RESIDENT' || ['RWA_ADMIN', 'ADMIN', 'MANAGER', 'SECRETARY', 'TREASURER', 'PRESIDENT', 'COMMITTEE_MEMBER', 'PLATFORM_ADMIN', 'PLATFORM_SUPER_ADMIN'].includes(user.role)
    const body = await request.json()
    const { notificationId, noticeId, markAll = false } = body

    if (markAll) {
      const whereClause = (isAdmin && user.organizationId)
        ? {
            OR: [
              { userId: user.id },
              { organizationId: user.organizationId },
            ],
            isRead: false,
          }
        : { userId: user.id, isRead: false }

      await prisma.notification.updateMany({
        where: whereClause,
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (noticeId) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          referenceType: 'NOTICE',
          referenceId: noticeId,
        },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true })
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Provide notificationId, noticeId, or markAll' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Error updating notification:', err)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
