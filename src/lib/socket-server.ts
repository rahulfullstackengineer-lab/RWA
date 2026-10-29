import { Server as SocketIOServer } from 'socket.io'

declare global {
  // eslint-disable-next-line no-var
  var __io: SocketIOServer | undefined
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
  target?: { orgId?: string; userId?: string }
) {
  const io = globalThis.__io
  if (!io) {
    return
  }

  try {
    if (target?.userId) {
      io.to(`user:${target.userId}`).emit(event, data)
    } else if (target?.orgId) {
      io.to(`org:${target.orgId}`).emit(event, data)
      // Broadcast globally as well so active admin sessions never miss updates
      io.emit(event, data)
    } else {
      io.emit(event, data)
    }
  } catch (err) {
    console.error('Error emitting socket event:', err)
  }
}
