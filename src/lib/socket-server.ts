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
  let userIds = options.userIds || []

  if (!options.userIds) {
    const users = await prisma.user.findMany({
      where: {
        organizationId: options.orgId,
        ...(roleList ? { role: { in: dbRolesForAudience(roleList) } } : {}),
        ...(options.excludeUserId ? { id: { not: options.excludeUserId } } : {}),
      },
      select: { id: true },
    })
    userIds = users.map((user) => user.id)
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

  if (options.userIds && options.userIds.length === 1 && !roleList) {
    emitLiveSocketEvent(options.event, {
      title: options.title,
      message: options.message,
      ...(options.data || {}),
    }, { userId: options.userIds[0] })
    return
  }

  emitLiveSocketEvent(options.event, {
    title: options.title,
    message: options.message,
    ...(options.data || {}),
  }, { orgId: options.orgId, roles: roleList })
}
