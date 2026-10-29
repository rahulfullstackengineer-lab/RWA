import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, unitId, occupancyType, name, email } = body

    if (!organizationId || !unitId) {
      return NextResponse.json({ error: 'Society and Unit selection are required' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Resident full name is required' }, { status: 400 })
    }

    const cleanName = name.trim()
    const cleanEmail = email ? email.trim() : null
    const roleType = occupancyType === 'TENANT' ? 'TENANT' : 'OWNER'

    // Verify unit and organization
    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
        organizationId: organizationId,
      },
      include: {
        block: true,
        organization: true,
      },
    })

    if (!unit) {
      return NextResponse.json({ error: 'Selected flat was not found in this society' }, { status: 404 })
    }

    const org = unit.organization
    const blockName = unit.block?.name || 'Main Block'

    // 1. Update Unit record with owner or tenant info
    const unitUpdateData: any = {}
    if (roleType === 'OWNER') {
      unitUpdateData.ownerName = cleanName
      unitUpdateData.ownerPhone = user.phone
      if (cleanEmail) unitUpdateData.ownerEmail = cleanEmail
      unitUpdateData.occupancyStatus = 'OWNER_OCCUPIED'
    } else {
      unitUpdateData.tenantName = cleanName
      unitUpdateData.tenantPhone = user.phone
      unitUpdateData.occupancyStatus = 'TENANTED'
    }

    const updatedUnit = await prisma.unit.update({
      where: { id: unit.id },
      data: unitUpdateData,
      include: { block: true },
    })

    // 2. Update User record
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: cleanName,
        email: cleanEmail || user.email,
        organizationId: org.id,
        unitId: unit.id,
        role: 'RESIDENT',
        status: 'ACTIVE',
      },
      include: {
        organization: true,
        unit: {
          include: { block: true },
        },
      },
    })

    // 3. Find all society admins to notify
    const adminCandidates = await prisma.user.findMany({
      where: {
        OR: [
          { organizationId: org.id, role: { in: ['RWA_ADMIN', 'ADMIN', 'MANAGER', 'SECRETARY', 'TREASURER', 'PRESIDENT', 'COMMITTEE_MEMBER', 'PLATFORM_ADMIN', 'PLATFORM_SUPER_ADMIN'] } },
          { organizationId: org.id, role: { not: 'RESIDENT' } },
          { role: { in: ['RWA_ADMIN', 'PLATFORM_ADMIN', 'PLATFORM_SUPER_ADMIN'] } },
          { phone: '8219587657' },
        ],
      },
      select: { id: true, name: true, phone: true, role: true },
    })

    // Deduplicate admin IDs
    const uniqueAdminMap = new Map<string, typeof adminCandidates[0]>()
    for (const a of adminCandidates) {
      if (a.id !== user.id) { // Don't notify the resident as an admin
        uniqueAdminMap.set(a.id, a)
      }
    }
    const admins = Array.from(uniqueAdminMap.values())

    const notifTitle = '👤 New Resident Added to Property Structure'
    const notifMessage = `Resident ${cleanName} (+91 ${user.phone}) has joined and connected to Unit ${unit.unitNumber} (${blockName}) as ${roleType === 'OWNER' ? 'Flat Owner' : 'Tenant'}.`

    // Create notifications for all admins
    for (const admin of admins) {
      try {
        await prisma.notification.create({
          data: {
            organizationId: org.id,
            userId: admin.id,
            title: notifTitle,
            message: notifMessage,
            type: 'RESIDENT_ONBOARDED',
            referenceType: 'UNIT',
            referenceId: unit.id,
          },
        })
      } catch (adminNotifErr) {
        console.warn('Failed to insert admin notification:', admin.id, adminNotifErr)
      }
    }

    // Also create welcome notification for the newly connected resident
    try {
      await prisma.notification.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          title: `🎉 Welcome to ${org.name}!`,
          message: `You are connected to Unit ${unit.unitNumber} (${blockName}) as ${roleType === 'OWNER' ? 'Flat Owner' : 'Tenant'}.`,
          type: 'RESIDENT_ONBOARDED',
          referenceType: 'UNIT',
          referenceId: unit.id,
        },
      })
    } catch (resNotifErr) {
      console.warn('Failed to create resident welcome notification:', resNotifErr)
    }

    // 4. Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          action: 'RESIDENT_ONBOARDED',
          entityType: 'Unit',
          entityId: unit.id,
          newValues: JSON.stringify({
            unitNumber: unit.unitNumber,
            block: blockName,
            residentName: cleanName,
            phone: user.phone,
            email: cleanEmail,
            occupancyType: roleType,
          }),
        },
      })
    } catch (auditErr) {
      console.warn('Audit log write error:', auditErr)
    }

    // 5. Emit Real-time Socket Event
    try {
      const socketPayload = {
        residentName: cleanName,
        phone: user.phone,
        unitNumber: unit.unitNumber,
        blockName,
        occupancyType: roleType,
        orgId: org.id,
        orgName: org.name,
        timestamp: new Date().toISOString(),
      }
      emitLiveSocketEvent('resident-onboarded', socketPayload, { orgId: org.id })
      emitLiveSocketEvent('resident-onboarded', socketPayload)
    } catch (sockErr) {
      console.warn('Socket event error:', sockErr)
    }

    return NextResponse.json({
      success: true,
      message: `Welcome to ${org.name}! You are now connected to Unit ${unit.unitNumber}.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role,
        organizationId: updatedUser.organizationId,
        organizationName: org.name,
        unitId: updatedUser.unitId,
        unitNumber: unit.unitNumber,
        blockName: blockName,
      },
      unit: updatedUnit,
      organization: {
        id: org.id,
        name: org.name,
        city: org.city,
      },
    })
  } catch (err: unknown) {
    console.error('Error connecting resident to unit:', err)
    return NextResponse.json({ error: 'Failed to connect resident to flat' }, { status: 500 })
  }
}
