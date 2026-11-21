import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { normalizePhone, societyMembershipBlock } from '@/lib/phone'
import { notifyUsers } from '@/lib/socket-server'

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

    const joinedElsewhere = await societyMembershipBlock(user.phone, unit.organizationId)
    if (joinedElsewhere.error) {
      return NextResponse.json({ error: joinedElsewhere.error }, { status: 403 })
    }
    if (user.role && user.role !== 'RESIDENT' && user.organizationId) {
      return NextResponse.json({ error: 'Society office accounts are assigned by the admin' }, { status: 403 })
    }

    const phone = normalizePhone(user.phone)
    const listedOnFlat = phone && (
      normalizePhone(unit.ownerPhone) === phone || normalizePhone(unit.tenantPhone) === phone
    )
    const flatIsOpen = !unit.ownerPhone && !unit.tenantPhone && (unit.occupancyStatus === 'VACANT' || !unit.occupancyStatus)
    if (!listedOnFlat && !flatIsOpen) {
      return NextResponse.json(
        { error: 'This flat is already assigned. Ask the society admin to add your mobile number to it.' },
        { status: 403 }
      )
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

    const notifMessage = `${cleanName} (+91 ${user.phone}) registered and connected to Unit ${unit.unitNumber} (${blockName}) as ${roleType === 'OWNER' ? 'Flat Owner' : 'Tenant'}.`

    try {
      await notifyUsers({
        orgId: org.id,
        roles: ['admin'],
        excludeUserId: user.id,
        title: 'New resident registered',
        message: notifMessage,
        type: 'RESIDENT_ONBOARDED',
        event: 'resident-onboarded',
        referenceType: 'UNIT',
        referenceId: unit.id,
        data: {
          residentName: cleanName,
          phone: user.phone,
          unitNumber: unit.unitNumber,
          blockName,
          occupancyType: roleType,
          orgName: org.name,
        },
      })
    } catch (adminNotifErr) {
      console.warn('Failed to notify admins about new resident:', adminNotifErr)
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
