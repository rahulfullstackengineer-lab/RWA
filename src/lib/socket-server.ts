import { Server as SocketIOServer } from 'socket.io'
import { prisma } from '@/lib/prisma'

declare global {
  // eslint-disable-next-line no-var
  var __io: SocketIOServer | undefined
}

export type AudienceRole = 'admin' | 'resident' | 'staff'

const ADMIN_DB_ROLES = ['RWA_ADMIN', 'ADMIN', 'TREASURER', 'SECRETARY', 'PRESIDENT', 'COMMITTEE_MEMBER', 'MANAGER']

export function audienceForDbRole(role: string | null | undefined): AudienceRole {
  if (role === 'STAFF') return 'staff'
  if (role && ADMIN_DB_ROLES.includes(role)) return 'admin'
  return 'resident'
}

function dbRolesForAudience(roles: AudienceRole[]): string[] {
  const out: string[] = []
  if (roles.includes('admin')) out.push(...ADMIN_DB_ROLES)
  if (roles.includes('resident')) out.push('RESIDENT')
  if (roles.includes('staff')) out.push('STAFF')
  return out
}

export interface SocketNotificationPayload {
  id: string
  title: string
  message: string
  type: string
  referenceType?: string | null
  referenceId?: string | null
  createdAt: Date | string
  userId?: string
  orgId?: string
}

/**
 * Emit a real-time event via Socket.io
 */
export function emitLiveSocketEvent(
  event: string,
  data: any,
  target?: { orgId?: string; userId?: string; roles?: AudienceRole[] }
) {
  const io = globalThis.__io
  if (!io) {
    console.warn(`[socket] ${event} was not delivered because the realtime server is not attached`)
    return
  }

  const payload = {
    ...data,
    event,
    audience: target?.roles && target.roles.length > 0 ? target.roles : ['admin', 'resident', 'staff'],
  }

  try {
    const emitTo = (room: string) => {
      io.to(room).emit(event, payload)
      if (event !== 'live-notification') {
        io.to(room).emit('live-notification', payload)
      }
    }

    if (target?.userId) {
      emitTo(`user:${target.userId}`)
      return
    }

    if (target?.orgId) {
      if (target.roles && target.roles.length > 0) {
        for (const role of target.roles) {
          emitTo(`org:${target.orgId}:${role}`)
        }
      } else {
        emitTo(`org:${target.orgId}`)
      }
    }
  } catch (err) {
    console.error('Error emitting socket event:', err)
  }
}

export async function notifyUsers(options: {
  orgId: string
  userIds?: string[]
  roles?: AudienceRole[]
  excludeUserId?: string
  title: string
  message: string
  type: string
  event: string
  data?: Record<string, unknown>
  referenceType?: string
  referenceId?: string
}) {
  const roleList = options.roles && options.roles.length > 0 ? options.roles : undefined
  const explicitIds = (options.userIds || []).filter((id) => id && id !== options.excludeUserId)
  let userIds = explicitIds

  if (!options.userIds || roleList) {
    const users = await prisma.user.findMany({
      where: {
        organizationId: options.orgId,
        ...(roleList ? { role: { in: dbRolesForAudience(roleList) } } : {}),
        ...(options.excludeUserId ? { id: { not: options.excludeUserId } } : {}),
      },
      select: { id: true },
    })
    userIds = Array.from(new Set([...users.map((user) => user.id), ...explicitIds]))
  }

  if (userIds.length > 0) {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        organizationId: options.orgId,
        userId,
        title: options.title,
        message: options.message.substring(0, 200),
        type: options.type,
        referenceType: options.referenceType || null,
        referenceId: options.referenceId || null,
      })),
    })
  }

  const payload = {
    title: options.title,
    message: options.message,
    ...(options.data || {}),
  }

  if (roleList) {
    emitLiveSocketEvent(options.event, payload, { orgId: options.orgId, roles: roleList })
  } else if (!options.userIds) {
    emitLiveSocketEvent(options.event, payload, { orgId: options.orgId })
  }

  for (const userId of explicitIds) {
    emitLiveSocketEvent(options.event, payload, { userId })
  }
}
