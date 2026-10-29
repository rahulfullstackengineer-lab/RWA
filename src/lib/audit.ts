import { prisma } from './prisma'

export interface LogAuditInput {
  organizationId?: string | null
  userId?: string | null
  action: string
  entityType?: string
  entityId?: string | null
  details?: any
  severity?: 'INFO' | 'WARNING' | 'CRITICAL'
  oldValues?: any
  newValues?: any
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Log an immutable audit event to the database
 */
export async function logAudit(input: LogAuditInput) {
  try {
    let newValuesPayload = input.newValues
    if (typeof newValuesPayload === 'object' && newValuesPayload !== null) {
      newValuesPayload = JSON.stringify({
        details: typeof input.details === 'object' ? JSON.stringify(input.details) : input.details,
        severity: input.severity || 'INFO',
        ...newValuesPayload,
      })
    } else if (input.details || input.severity) {
      newValuesPayload = JSON.stringify({
        details: typeof input.details === 'object' ? JSON.stringify(input.details) : (input.details || String(newValuesPayload || '')),
        severity: input.severity || 'INFO',
      })
    }

    const oldValuesPayload =
      typeof input.oldValues === 'object' && input.oldValues !== null
        ? JSON.stringify(input.oldValues)
        : input.oldValues
        ? String(input.oldValues)
        : null

    return await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId || null,
        userId: input.userId || null,
        action: input.action,
        entityType: input.entityType || 'SYSTEM',
        entityId: input.entityId || null,
        oldValues: oldValuesPayload,
        newValues: typeof newValuesPayload === 'string' ? newValuesPayload : null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    })
  } catch (err) {
    console.error('Error logging audit event:', err)
    return null
  }
}
