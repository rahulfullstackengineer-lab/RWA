import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { notifyUsers } from '@/lib/socket-server'

async function notifyAboutPass(
  orgId: string,
  flatNumber: string,
  title: string,
  message: string,
  data: Record<string, unknown>,
  referenceId?: string
) {
  const residents = flatNumber
    ? await prisma.user.findMany({
        where: { organizationId: orgId, unit: { unitNumber: flatNumber } },
        select: { id: true },
      })
    : []
  await notifyUsers({
    orgId,
    roles: ['admin', 'staff'],
    userIds: residents.map((person) => person.id),
    title,
    message,
    type: 'ENTRY_PASS',
    event: 'passes:updated',
    referenceType: 'EntryPass',
    referenceId,
    data,
  })
}

const SAMPLE_PASS_CODES = [
  'PASS-84920', 'PASS-61294', 'PASS-99381', 'PASS-55201', 'PASS-41890', 'PASS-73019',
  'PASS-22001', 'PASS-22002', 'PASS-22003', 'PASS-22004', 'PASS-22005', 'PASS-22006',
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    let unit = searchParams.get('unit')?.trim()
    const status = searchParams.get('status')?.trim()
    const visitorType = searchParams.get('visitorType')?.trim()
    const search = searchParams.get('search')?.trim()
    const gate = searchParams.get('gate')?.trim()

    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }
    const organizationId = user.organizationId
    if (!organizationId) {
      return NextResponse.json({ success: true, passes: [], stats: {} })
    }
    if (user.role === 'RESIDENT' && user.unit?.unitNumber) {
      unit = user.unit.unitNumber
    }

    await prisma.entryPass.deleteMany({
      where: {
        organizationId,
        passCode: { in: SAMPLE_PASS_CODES },
      },
    })

    // Build filter
    const whereClause: any = { organizationId }

    if (unit && unit !== 'ALL') {
      whereClause.residentUnit = { contains: unit }
    }

    if (status && status !== 'ALL') {
      whereClause.status = status
    }

    if (visitorType && visitorType !== 'ALL') {
      whereClause.visitorType = visitorType
    }

    if (gate && gate !== 'ALL') {
      whereClause.gateNumber = { contains: gate }
    }

    if (search) {
      whereClause.OR = [
        { passCode: { contains: search } },
        { otpPin: { contains: search } },
        { visitorName: { contains: search } },
        { visitorPhone: { contains: search } },
        { residentName: { contains: search } },
        { residentUnit: { contains: search } },
        { vehicleNumber: { contains: search } },
        { purpose: { contains: search } },
      ]
    }

    const passes = await prisma.entryPass.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })

    // Compute live stats for this society
    const allPasses = await prisma.entryPass.findMany({
      where: { organizationId },
      select: { status: true, visitorType: true, createdAt: true },
    })

    const stats = {
      totalPasses: allPasses.length,
      activeToday: allPasses.filter(p => p.status === 'APPROVED' || p.status === 'CHECKED_IN').length,
      checkedInNow: allPasses.filter(p => p.status === 'CHECKED_IN').length,
      preApproved: allPasses.filter(p => p.status === 'APPROVED').length,
      checkedOutToday: allPasses.filter(p => p.status === 'CHECKED_OUT').length,
      deliveries: allPasses.filter(p => p.visitorType === 'DELIVERY').length,
      cabs: allPasses.filter(p => p.visitorType === 'CAB').length,
    }

    return NextResponse.json({
      success: true,
      passes,
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching entry passes:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch entry passes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      visitorName,
      visitorPhone,
      visitorType = 'GUEST',
      vehicleNumber,
      purpose,
      residentName,
      residentPhone,
      residentUnit,
      unitId,
      gateNumber = 'Gate 1 - Main Gate',
      validHours = 12,
      notes,
    } = body

    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }
    const organizationId = user.organizationId
    if (!organizationId) {
      return NextResponse.json({ error: 'Join a society before issuing a visitor pass' }, { status: 400 })
    }

    let flatNumber = residentUnit?.trim() || ''
    if (user.role === 'RESIDENT') {
      flatNumber = user.unit?.unitNumber || ''
    }
    if (!visitorName?.trim() || !flatNumber) {
      return NextResponse.json(
        { error: 'Visitor name and Flat number are required' },
        { status: 400 }
      )
    }

    // Generate unique Pass Code and OTP PIN
    const randomSuffix = Math.floor(10000 + Math.random() * 90000).toString()
    const passCode = `PASS-${randomSuffix}`
    const otpPin = Math.floor(1000 + Math.random() * 9000).toString()

    const now = new Date()
    const hoursNum = parseInt(validHours) || 12
    const validUntil = new Date(now.getTime() + hoursNum * 60 * 60 * 1000)

    const newPass = await prisma.entryPass.create({
      data: {
        organizationId,
        passCode,
        otpPin,
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone?.trim() || 'N/A',
        visitorType: visitorType || 'GUEST',
        vehicleNumber: vehicleNumber?.trim() || null,
        purpose: purpose?.trim() || null,
        residentName: residentName?.trim() || 'Resident',
        residentPhone: residentPhone?.trim() || null,
        residentUnit: flatNumber,
        unitId: unitId || null,
        gateNumber: gateNumber || 'Gate 1 - Main Gate',
        validFrom: now,
        validUntil,
        status: 'APPROVED',
        notes: notes?.trim() || null,
      },
    })

    await notifyAboutPass(
      organizationId,
      newPass.residentUnit,
      `Visitor pass: ${newPass.visitorName}`,
      `${newPass.visitorName} is expected at flat ${newPass.residentUnit}. Gate code ${newPass.otpPin}.`,
      { action: 'CREATED', pass: newPass },
      newPass.id
    )

    return NextResponse.json({
      success: true,
      pass: newPass,
      message: `Visiting pass ${newPass.passCode} generated successfully!`,
    })
  } catch (error: any) {
    console.error('Error creating entry pass:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create entry pass' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, action, guardName, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Entry Pass ID is required' }, { status: 400 })
    }

    const pass = await prisma.entryPass.findFirst({
      where: { id, organizationId: user.organizationId || '__none__' },
    })

    if (!pass) {
      return NextResponse.json({ error: 'Entry Pass not found' }, { status: 404 })
    }

    let updateData: any = {}
    let notificationTitle = ''
    let notificationMsg = ''

    const gateRoles = ['STAFF', 'RWA_ADMIN', 'TREASURER', 'COMMITTEE_MEMBER']
    if ((action === 'check_in' || action === 'check_out') && !gateRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Only security or the society admin can check visitors in or out' }, { status: 403 })
    }
    if ((action === 'cancel' || action === 'revoke') && user.role === 'RESIDENT' && user.unit?.unitNumber !== pass.residentUnit) {
      return NextResponse.json({ error: 'You can only cancel a pass for your own flat' }, { status: 403 })
    }

    if (action === 'check_in') {
      const now = new Date()
      updateData = {
        status: 'CHECKED_IN',
        checkedInAt: now,
        checkedInBy: guardName || 'Gate Security Guard',
        notes: notes ? (pass.notes ? `${pass.notes} | ${notes}` : notes) : pass.notes,
      }
      notificationTitle = `🔔 Visitor Arrived at Gate: ${pass.visitorName}`
      notificationMsg = `Your visitor ${pass.visitorName} (${pass.visitorType}) has just checked in at ${pass.gateNumber} with security guard ${guardName || 'Security'}.`
    } else if (action === 'check_out') {
      const now = new Date()
      updateData = {
        status: 'CHECKED_OUT',
        checkedOutAt: now,
        checkedOutBy: guardName || 'Gate Security Guard',
      }
      notificationTitle = `🚪 Visitor Checked Out: ${pass.visitorName}`
      notificationMsg = `Your visitor ${pass.visitorName} has departed society premises through ${pass.gateNumber}.`
    } else if (action === 'cancel' || action === 'revoke') {
      updateData = {
        status: 'CANCELLED',
      }
      notificationTitle = `❌ Visiting Pass Revoked: ${pass.passCode}`
      notificationMsg = `Visiting pass for ${pass.visitorName} (Flat ${pass.residentUnit}) has been cancelled.`
    } else if (action === 'approve') {
      updateData = {
        status: 'APPROVED',
      }
    } else {
      // General update
      if (body.gateNumber) updateData.gateNumber = body.gateNumber
      if (body.vehicleNumber !== undefined) updateData.vehicleNumber = body.vehicleNumber
      if (body.notes !== undefined) updateData.notes = body.notes
    }

    const updatedPass = await prisma.entryPass.update({
      where: { id },
      data: updateData,
    })

    await notifyAboutPass(
      updatedPass.organizationId,
      updatedPass.residentUnit,
      notificationTitle || `Visitor pass ${updatedPass.status}: ${updatedPass.visitorName}`,
      notificationMsg || `Flat ${updatedPass.residentUnit}: ${updatedPass.visitorName} is now ${updatedPass.status}.`,
      { action: action?.toUpperCase() || 'UPDATED', pass: updatedPass },
      updatedPass.id
    )

    return NextResponse.json({
      success: true,
      pass: updatedPass,
      message: `Pass ${updatedPass.passCode} status updated to ${updatedPass.status}`,
    })
  } catch (error: any) {
    console.error('Error updating entry pass:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update entry pass' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user || !['RWA_ADMIN', 'TREASURER'].includes(user.role)) {
      return NextResponse.json({ error: 'Only the society admin can delete a pass' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Entry Pass ID is required' }, { status: 400 })
    }

    const existing = await prisma.entryPass.findFirst({
      where: { id, organizationId: user.organizationId || '__none__' },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Entry Pass not found' }, { status: 404 })
    }

    const deleted = await prisma.entryPass.delete({
      where: { id: existing.id },
    })

    await notifyAboutPass(
      existing.organizationId,
      existing.residentUnit,
      `Visitor pass cancelled: ${existing.visitorName}`,
      `The pass for flat ${existing.residentUnit} was removed.`,
      { action: 'DELETED', passId: id, pass: existing },
      existing.id
    )

    return NextResponse.json({
      success: true,
      message: `Pass ${deleted.passCode} deleted successfully`,
    })
  } catch (error: any) {
    console.error('Error deleting entry pass:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete entry pass' },
      { status: 500 }
    )
  }
}
