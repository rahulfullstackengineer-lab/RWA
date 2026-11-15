import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { notifyUsers } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'

// POST /api/emergency/sos — Resident or Admin triggers high-priority Panic SOS
export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const orgId = user.organizationId!
    const body = await request.json().catch(() => ({}))
    const { type = 'GENERAL', note = '' } = body

    // Fetch user details including unit
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { unit: true, organization: true },
    })

    const unitNumber = fullUser?.unit?.unitNumber || 'Campus Flat'
    const residentName = fullUser?.name || 'Resident'
    const phone = fullUser?.phone || ''

    await notifyUsers({
      orgId,
      roles: ['admin', 'staff'],
      excludeUserId: user.id,
      title: `🚨 EMERGENCY SOS: Flat ${unitNumber}`,
      message: `${residentName} (${phone}) triggered an urgent ${type} alarm.${note ? ' ' + note : ''}`,
      type: 'EMERGENCY',
      event: 'sos:alarm-triggered',
      referenceType: 'SOS',
      referenceId: user.id,
      data: {
        orgId,
        userId: user.id,
        residentName,
        phone,
        unitNumber,
        type,
        note,
        timestamp: new Date().toISOString(),
      },
    })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'TRIGGER_EMERGENCY_SOS',
      entityType: 'EmergencySOS',
      entityId: user.id,
      newValues: JSON.stringify({ unitNumber, residentName, phone, type, note }),
    })

    return NextResponse.json({
      success: true,
      message: `Emergency SOS dispatched! On-duty security guards and the RWA Managing Committee have been alerted for Flat ${unitNumber}.`,
      unitNumber,
      residentName,
    })
  } catch (err: unknown) {
    console.error('Emergency SOS error:', err)
    return NextResponse.json({ error: 'Failed to dispatch SOS alarm' }, { status: 500 })
  }
}
