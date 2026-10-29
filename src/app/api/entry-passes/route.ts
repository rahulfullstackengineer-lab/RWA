import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

function getIO() {
  if (typeof global !== 'undefined' && (global as any).__io) {
    return (global as any).__io
  }
  return null
}

const SEED_PASSES = [
  {
    passCode: 'PASS-84920',
    otpPin: '4821',
    visitorName: 'Amitava Sen',
    visitorPhone: '9818123456',
    visitorType: 'GUEST',
    vehicleNumber: 'CH 01 BG 4421',
    purpose: 'Family dinner & weekend meet',
    residentName: 'Dr. Vikram Malhotra',
    residentPhone: '9812345678',
    residentUnit: 'A-402',
    gateNumber: 'Gate 1 - Main Gate',
    status: 'CHECKED_IN',
    checkedInBy: 'Ram Singh (Gate 1)',
    notes: 'Parked in Guest Bay G-04',
  },
  {
    passCode: 'PASS-61294',
    otpPin: '7392',
    visitorName: 'Raju Kumar (Zomato)',
    visitorPhone: '9829384756',
    visitorType: 'DELIVERY',
    vehicleNumber: 'PB 65 AB 7712',
    purpose: 'Food delivery #ZOM-88219',
    residentName: 'Ananya Sharma',
    residentPhone: '9823456789',
    residentUnit: 'B-201',
    gateNumber: 'Gate 1 - Main Gate',
    status: 'APPROVED',
    notes: 'Direct intercom verified with flat',
  },
  {
    passCode: 'PASS-99381',
    otpPin: '2490',
    visitorName: 'Sukhwinder Singh (Uber)',
    visitorPhone: '9872109834',
    visitorType: 'CAB',
    vehicleNumber: 'HR 26 DQ 8832',
    purpose: 'Airport drop cab pickup',
    residentName: 'Rajesh Kumar',
    residentPhone: '9834567890',
    residentUnit: 'A-104',
    gateNumber: 'Gate 1 - Main Gate',
    status: 'CHECKED_IN',
    checkedInBy: 'Ram Singh (Gate 1)',
    notes: '5 min waiting allowed at porch',
  },
  {
    passCode: 'PASS-55201',
    otpPin: '6115',
    visitorName: 'Manoj (Urban Company)',
    visitorPhone: '9811223344',
    visitorType: 'SERVICE',
    vehicleNumber: 'PB 01 XY 3302',
    purpose: 'RO Water Purifier Service & Filter Change',
    residentName: 'Sunil Verma',
    residentPhone: '9845678901',
    residentUnit: 'B-305',
    gateNumber: 'Gate 2 - Service Gate',
    status: 'APPROVED',
    notes: 'Service toolkit verified by security',
  },
  {
    passCode: 'PASS-41890',
    otpPin: '8204',
    visitorName: 'Pooja Singhania',
    visitorPhone: '9876501234',
    visitorType: 'GUEST',
    vehicleNumber: 'DL 3C AU 9901',
    purpose: 'Family celebration visit',
    residentName: 'Meenakshi Sundaram',
    residentPhone: '9856789012',
    residentUnit: 'A-301',
    gateNumber: 'Gate 1 - Main Gate',
    status: 'CHECKED_OUT',
    checkedInBy: 'Ram Singh (Gate 1)',
    checkedOutBy: 'Suraj Sharma (Gate 1)',
    notes: 'Exited campus at Gate 1',
  },
  {
    passCode: 'PASS-73019',
    otpPin: '3187',
    visitorName: 'Mukesh (Amazon Logistics)',
    visitorPhone: '9833445566',
    visitorType: 'DELIVERY',
    vehicleNumber: 'PB 02 C 1290',
    purpose: 'Amazon parcel delivery #AMZ-993',
    residentName: 'Rohit Bansal',
    residentPhone: '9867890123',
    residentUnit: 'A-202',
    gateNumber: 'Gate 2 - Service Gate',
    status: 'APPROVED',
    notes: 'Heavy appliance delivery',
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const unit = searchParams.get('unit')?.trim()
    const status = searchParams.get('status')?.trim()
    const visitorType = searchParams.get('visitorType')?.trim()
    const search = searchParams.get('search')?.trim()
    const gate = searchParams.get('gate')?.trim()

    let organizationId = searchParams.get('orgId') || null
    if (!organizationId) {
      const { user } = await requireAuth(request).catch(() => ({ user: null }))
      organizationId = user?.organizationId || null
    }

    if (!organizationId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      organizationId = firstOrg?.id || null
    }

    if (!organizationId) {
      return NextResponse.json({ success: true, passes: [], stats: {} })
    }

    // Auto-seed if empty
    const existingCount = await prisma.entryPass.count({
      where: { organizationId },
    })

    if (existingCount === 0) {
      const now = new Date()
      const validUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000)

      for (const item of SEED_PASSES) {
        await prisma.entryPass.create({
          data: {
            organizationId,
            passCode: item.passCode,
            otpPin: item.otpPin,
            visitorName: item.visitorName,
            visitorPhone: item.visitorPhone,
            visitorType: item.visitorType,
            vehicleNumber: item.vehicleNumber,
            purpose: item.purpose,
            residentName: item.residentName,
            residentPhone: item.residentPhone,
            residentUnit: item.residentUnit,
            gateNumber: item.gateNumber,
            validFrom: new Date(now.getTime() - 2 * 60 * 60 * 1000),
            validUntil: validUntil,
            status: item.status,
            checkedInAt: item.status === 'CHECKED_IN' || item.status === 'CHECKED_OUT' ? new Date(now.getTime() - 90 * 60 * 1000) : null,
            checkedInBy: item.checkedInBy || null,
            checkedOutAt: item.status === 'CHECKED_OUT' ? new Date(now.getTime() - 15 * 60 * 1000) : null,
            checkedOutBy: item.checkedOutBy || null,
            notes: item.notes,
          },
        })
      }
    }

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

    if (!visitorName?.trim() || !residentUnit?.trim()) {
      return NextResponse.json(
        { error: 'Visitor name and Flat number are required' },
        { status: 400 }
      )
    }

    let organizationId = body.organizationId || null
    if (!organizationId) {
      const { user } = await requireAuth(request).catch(() => ({ user: null }))
      organizationId = user?.organizationId || null
    }

    if (!organizationId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      organizationId = firstOrg?.id || null
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
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
        residentUnit: residentUnit.trim(),
        unitId: unitId || null,
        gateNumber: gateNumber || 'Gate 1 - Main Gate',
        validFrom: now,
        validUntil,
        status: 'APPROVED',
        notes: notes?.trim() || null,
      },
    })

    // Broadcast notifications to resident & admin
    try {
      const societyUsers = await prisma.user.findMany({
        where: {
          organizationId,
          OR: [
            { unit: { unitNumber: residentUnit.trim() } },
            { role: { in: ['RWA_ADMIN', 'SECURITY', 'STAFF'] } },
          ],
        },
        select: { id: true, role: true },
      })

      if (societyUsers.length > 0) {
        await prisma.notification.createMany({
          data: societyUsers.map(u => ({
            organizationId,
            userId: u.id,
            title: `🎫 Entry Pass Generated: ${newPass.passCode}`,
            message: `Visiting Pass for ${newPass.visitorName} (${newPass.visitorType}) to Flat ${newPass.residentUnit}. Gate Code: ${newPass.otpPin}`,
            type: 'ENTRY_PASS',
            referenceType: 'EntryPass',
            referenceId: newPass.id,
          })),
        })
      }
    } catch (notifErr) {
      console.warn('Could not broadcast entry pass creation notification:', notifErr)
    }

    // Emit live WebSocket event
    const io = getIO()
    if (io) {
      io.emit('passes:updated', {
        action: 'CREATED',
        pass: newPass,
      })
    }

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
    const body = await request.json()
    const { id, action, guardName, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Entry Pass ID is required' }, { status: 400 })
    }

    const pass = await prisma.entryPass.findUnique({
      where: { id },
    })

    if (!pass) {
      return NextResponse.json({ error: 'Entry Pass not found' }, { status: 404 })
    }

    let updateData: any = {}
    let notificationTitle = ''
    let notificationMsg = ''

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

    // Notify resident if check-in or check-out occurred
    if (notificationTitle && pass.organizationId) {
      try {
        const residentUsers = await prisma.user.findMany({
          where: {
            organizationId: pass.organizationId,
            unit: { unitNumber: pass.residentUnit },
          },
          select: { id: true },
        })

        if (residentUsers.length > 0) {
          await prisma.notification.createMany({
            data: residentUsers.map(u => ({
              organizationId: pass.organizationId,
              userId: u.id,
              title: notificationTitle,
              message: notificationMsg,
              type: 'VISITOR_ALERT',
              referenceType: 'EntryPass',
              referenceId: pass.id,
            })),
          })
        }
      } catch (e) {
        console.warn('Could not send resident visitor alert:', e)
      }
    }

    // Emit live WebSocket update
    const io = getIO()
    if (io) {
      io.emit('passes:updated', {
        action: action?.toUpperCase() || 'UPDATED',
        pass: updatedPass,
      })
    }

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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Entry Pass ID is required' }, { status: 400 })
    }

    const deleted = await prisma.entryPass.delete({
      where: { id },
    })

    const io = getIO()
    if (io) {
      io.emit('passes:updated', {
        action: 'DELETED',
        passId: id,
      })
    }

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
