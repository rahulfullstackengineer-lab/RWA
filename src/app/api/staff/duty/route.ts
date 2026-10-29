import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'

// Helper to seed initial staff duty roster if empty
async function seedDefaultStaffDuties(orgId: string) {
  try {
    const defaultDuties = [
      {
        organizationId: orgId,
        staffName: 'Ram Singh',
        role: 'Senior Head Guard (Gate 1)',
        category: 'SECURITY',
        phone: '9876543231',
        altPhone: 'Ext 101',
        blockName: 'Main Gate',
        locationPost: 'Gate 1 Main Entrance Desk',
        shiftName: 'Morning Shift',
        startTime: '06:00 AM',
        endTime: '02:00 PM',
        status: 'ON_DUTY',
        isEmergencyContact: true,
        notes: 'Senior guard supervising visitor entries and vehicle boom barriers at Gate 1.',
        order: 1,
      },
      {
        organizationId: orgId,
        staffName: 'Dharmendra Kumar',
        role: 'Security Guard (Visitor Desk)',
        category: 'SECURITY',
        phone: '9876543232',
        altPhone: 'Ext 101',
        blockName: 'Main Gate',
        locationPost: 'Gate 1 Visitor Registration Desk',
        shiftName: 'Morning Shift',
        startTime: '06:00 AM',
        endTime: '02:00 PM',
        status: 'ON_DUTY',
        isEmergencyContact: false,
        notes: 'Digital visitor and delivery verification at Main Gate 1.',
        order: 2,
      },
      {
        organizationId: orgId,
        staffName: 'Bijender Yadav',
        role: 'Security Guard (Gate 2 Exit)',
        category: 'SECURITY',
        phone: '9876543233',
        altPhone: 'Ext 102',
        blockName: 'Service Gate',
        locationPost: 'Gate 2 Resident Exit & Delivery Post',
        shiftName: 'General Shift',
        startTime: '08:00 AM',
        endTime: '08:00 PM',
        status: 'ON_DUTY',
        isEmergencyContact: true,
        notes: 'Regulates resident exit lane and commercial delivery trucks.',
        order: 3,
      },
      {
        organizationId: orgId,
        staffName: 'Manoj Tiwari',
        role: 'CCTV Surveillance Officer',
        category: 'SECURITY',
        phone: '9876543235',
        altPhone: 'Ext 103',
        blockName: 'Clubhouse',
        locationPost: 'Central CCTV & Fire Alarm Control Room',
        shiftName: 'Morning Shift',
        startTime: '07:00 AM',
        endTime: '03:00 PM',
        status: 'ON_DUTY',
        isEmergencyContact: true,
        notes: 'Monitoring 48 campus cameras and fire alarm indicators.',
        order: 4,
      },
      {
        organizationId: orgId,
        staffName: 'Suraj Sharma',
        role: 'Night Armed Guard (Patrol)',
        category: 'SECURITY',
        phone: '9876543234',
        altPhone: 'Ext 101',
        blockName: 'Campus Wide',
        locationPost: 'Perimeter Boundary & Basement B1/B2 Patrol',
        shiftName: 'Night Shift',
        startTime: '10:00 PM',
        endTime: '06:00 AM',
        status: 'UPCOMING',
        isEmergencyContact: true,
        notes: 'Night rover guard checking boundary walls, DG sets, and basement parkings.',
        order: 5,
      },
      {
        organizationId: orgId,
        staffName: 'Ramesh Paswan',
        role: 'Facility & Floor Supervisor',
        category: 'SUPERVISOR',
        phone: '9876543236',
        altPhone: 'Ext 107',
        blockName: 'Block A & B',
        locationPost: 'Tower A & Tower B Common Corridors',
        shiftName: 'General Shift',
        startTime: '08:30 AM',
        endTime: '05:30 PM',
        status: 'ON_DUTY',
        isEmergencyContact: false,
        notes: 'Supervising floor housekeeping, lift cleanliness, and waste pickup.',
        order: 6,
      },
      {
        organizationId: orgId,
        staffName: 'Sunita Devi',
        role: 'Tower A Housekeeper',
        category: 'HOUSEKEEPING',
        phone: '9876543237',
        altPhone: '',
        blockName: 'Block A',
        locationPost: 'Tower A Floors 1 to 10 & Lift Lobby',
        shiftName: 'Morning Shift',
        startTime: '07:00 AM',
        endTime: '03:00 PM',
        status: 'ON_DUTY',
        isEmergencyContact: false,
        notes: 'Corridor mopping, stairwell sanitization, and morning garbage collection.',
        order: 7,
      },
      {
        organizationId: orgId,
        staffName: 'Rekha Rani',
        role: 'Tower B Housekeeper',
        category: 'HOUSEKEEPING',
        phone: '9876543238',
        altPhone: '',
        blockName: 'Block B',
        locationPost: 'Tower B Floors 1 to 10 & Lift Lobby',
        shiftName: 'Morning Shift',
        startTime: '07:00 AM',
        endTime: '03:00 PM',
        status: 'ON_DUTY',
        isEmergencyContact: false,
        notes: 'Corridor mopping and common area waste management.',
        order: 8,
      },
      {
        organizationId: orgId,
        staffName: 'Mahesh Electrician',
        role: 'Campus Duty Electrician (AMC)',
        category: 'MAINTENANCE',
        phone: '9876543239',
        altPhone: 'Ext 104',
        blockName: 'Campus Wide',
        locationPost: 'Electrical Substation & Meter Rooms',
        shiftName: 'General Shift',
        startTime: '09:00 AM',
        endTime: '06:00 PM',
        status: 'ON_DUTY',
        isEmergencyContact: true,
        notes: 'Attending resident power fuse calls, transformer checks, and DG fuel checks.',
        order: 9,
      },
      {
        organizationId: orgId,
        staffName: 'Shankar Plumber',
        role: 'Campus Duty Plumber (AMC)',
        category: 'MAINTENANCE',
        phone: '9876543240',
        altPhone: 'Ext 105',
        blockName: 'Campus Wide',
        locationPost: 'Pump House & Overhead Tank Manifolds',
        shiftName: 'General Shift',
        startTime: '09:00 AM',
        endTime: '06:00 PM',
        status: 'ON_DUTY',
        isEmergencyContact: true,
        notes: 'Water supply management, pipeline leak fixes, and sump pump inspection.',
        order: 10,
      },
      {
        organizationId: orgId,
        staffName: 'Radhey Shyam',
        role: 'Head Gardener & Horticulture',
        category: 'GARDENING',
        phone: '9876543241',
        altPhone: '',
        blockName: 'Central Park',
        locationPost: 'Society Central Lawn & Children Play Park',
        shiftName: 'Day Shift',
        startTime: '07:30 AM',
        endTime: '04:30 PM',
        status: 'ON_DUTY',
        isEmergencyContact: false,
        notes: 'Lawn watering, plant pruning, and park maintenance.',
        order: 11,
      },
    ]

    for (const item of defaultDuties) {
      await prisma.staffDuty.create({ data: item })
    }
  } catch (err) {
    console.error('Error seeding default staff duties:', err)
  }
}

// Helper to broadcast notification to all residents in organization
async function broadcastDutyNotification(
  orgId: string,
  title: string,
  message: string,
  dutyId: string
) {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true },
    })

    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          organizationId: orgId,
          userId: u.id,
          title,
          message: message.substring(0, 200),
          type: 'STAFF_DUTY',
          referenceType: 'STAFF_DUTY',
          referenceId: dutyId,
        })),
      })
    }
  } catch (err) {
    console.error('Error broadcasting duty notification to residents:', err)
  }
}

// GET /api/staff/duty — Fetch duty roster for society
export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const orgId = user.organizationId!
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const blockName = searchParams.get('blockName')

    let count = await prisma.staffDuty.count({
      where: { organizationId: orgId },
    })

    if (count === 0) {
      await seedDefaultStaffDuties(orgId)
    }

    const where: any = { organizationId: orgId }
    if (category && category !== 'ALL') {
      where.category = category
    }
    if (status && status !== 'ALL') {
      where.status = status
    }
    if (blockName && blockName !== 'ALL') {
      where.blockName = blockName
    }

    const duties = await prisma.staffDuty.findMany({
      where,
      orderBy: [{ status: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    })

    // Compute metrics
    const allDuties = await prisma.staffDuty.findMany({
      where: { organizationId: orgId },
      select: { category: true, status: true, locationPost: true },
    })

    const metrics = {
      totalStaff: allDuties.length,
      onDutyNow: allDuties.filter((d) => d.status === 'ON_DUTY').length,
      securityGuardsOnDuty: allDuties.filter(
        (d) => d.category === 'SECURITY' && d.status === 'ON_DUTY'
      ).length,
      techniciansActive: allDuties.filter(
        (d) => d.category === 'MAINTENANCE' && d.status === 'ON_DUTY'
      ).length,
      housekeepingActive: allDuties.filter(
        (d) => d.category === 'HOUSEKEEPING' && d.status === 'ON_DUTY'
      ).length,
      gatesCovered: Array.from(
        new Set(
          allDuties
            .filter((d) => d.status === 'ON_DUTY' && (d.locationPost || '').toLowerCase().includes('gate'))
            .map((d) => d.locationPost)
        )
      ).length,
    }

    return NextResponse.json({
      success: true,
      duties,
      metrics,
    })
  } catch (err: any) {
    console.error('Error fetching staff duty roster:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// POST /api/staff/duty — Create new duty assignment (Admin only)
export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 })
    }

    const orgId = user.organizationId!
    const body = await request.json()

    // Support RESET_DEFAULTS action
    if (body.action === 'RESET_DEFAULTS') {
      await prisma.staffDuty.deleteMany({ where: { organizationId: orgId } })
      await seedDefaultStaffDuties(orgId)
      const duties = await prisma.staffDuty.findMany({ where: { organizationId: orgId } })

      await broadcastDutyNotification(
        orgId,
        '🛡️ Society Staff Duty Roster Initialized',
        'Official duty roster for security guards, gate posts, housekeeping, and maintenance technicians has been published.',
        'roster-reset'
      )

      emitLiveSocketEvent('duty:roster-updated', {
        action: 'RESET_DEFAULTS',
        message: 'Duty roster refreshed with standard society security & maintenance posts',
      })

      return NextResponse.json({ success: true, count: duties.length, duties })
    }

    const {
      staffName,
      role,
      category = 'SECURITY',
      phone,
      altPhone = '',
      blockName = 'Main Gate',
      locationPost,
      shiftName = 'Morning Shift',
      startTime = '06:00 AM',
      endTime = '02:00 PM',
      status = 'ON_DUTY',
      isEmergencyContact = false,
      notes = '',
      notifyResidents = true,
    } = body

    if (!staffName || !role || !locationPost || !phone) {
      return NextResponse.json(
        { error: 'Staff Name, Role, Location Post, and Phone Number are required' },
        { status: 400 }
      )
    }

    const duty = await prisma.staffDuty.create({
      data: {
        organizationId: orgId,
        staffName: staffName.trim(),
        role: role.trim(),
        category,
        phone: phone.trim(),
        altPhone: altPhone ? altPhone.trim() : null,
        blockName: blockName ? blockName.trim() : null,
        locationPost: locationPost.trim(),
        shiftName: shiftName.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        status,
        isEmergencyContact: Boolean(isEmergencyContact),
        notes: notes ? notes.trim() : null,
      },
    })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'DUTY_ASSIGNED',
      entityType: 'STAFF_DUTY',
      entityId: duty.id,
      details: { staffName: duty.staffName, role: duty.role, post: duty.locationPost, shift: duty.shiftName },
    })

    if (notifyResidents !== false) {
      await broadcastDutyNotification(
        orgId,
        `🛡️ Staff Duty Assigned: ${duty.staffName}`,
        `${duty.staffName} (${duty.role}) is stationed at ${duty.locationPost} for ${duty.shiftName} (${duty.startTime} - ${duty.endTime}). Phone: ${duty.phone}`,
        duty.id
      )
    }

    emitLiveSocketEvent('duty:roster-updated', {
      action: 'CREATED',
      duty,
      message: `${duty.staffName} assigned to ${duty.locationPost}`,
    })

    return NextResponse.json({ success: true, duty })
  } catch (err: any) {
    console.error('Error creating staff duty assignment:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// PUT /api/staff/duty — Update duty post, timings, or personnel (Admin only)
export async function PUT(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 })
    }

    const orgId = user.organizationId!
    const body = await request.json()
    const { id, notifyResidents = true, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Duty Assignment ID is required' }, { status: 400 })
    }

    const existing = await prisma.staffDuty.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Duty record not found' }, { status: 404 })
    }

    const updated = await prisma.staffDuty.update({
      where: { id },
      data: {
        ...(updates.staffName && { staffName: updates.staffName.trim() }),
        ...(updates.role && { role: updates.role.trim() }),
        ...(updates.category && { category: updates.category }),
        ...(updates.phone && { phone: updates.phone.trim() }),
        ...(updates.altPhone !== undefined && { altPhone: updates.altPhone ? updates.altPhone.trim() : null }),
        ...(updates.blockName !== undefined && { blockName: updates.blockName ? updates.blockName.trim() : null }),
        ...(updates.locationPost && { locationPost: updates.locationPost.trim() }),
        ...(updates.shiftName && { shiftName: updates.shiftName.trim() }),
        ...(updates.startTime && { startTime: updates.startTime.trim() }),
        ...(updates.endTime && { endTime: updates.endTime.trim() }),
        ...(updates.status && { status: updates.status }),
        ...(updates.isEmergencyContact !== undefined && { isEmergencyContact: Boolean(updates.isEmergencyContact) }),
        ...(updates.notes !== undefined && { notes: updates.notes ? updates.notes.trim() : null }),
      },
    })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'DUTY_UPDATED',
      entityType: 'STAFF_DUTY',
      entityId: updated.id,
      details: {
        staffName: updated.staffName,
        post: updated.locationPost,
        shift: updated.shiftName,
        timing: `${updated.startTime} - ${updated.endTime}`,
        status: updated.status,
      },
    })

    if (notifyResidents !== false) {
      await broadcastDutyNotification(
        orgId,
        `🔄 Staff Duty Update: ${updated.staffName} (${updated.locationPost})`,
        `${updated.staffName} (${updated.role}) is stationed at ${updated.locationPost} (${updated.shiftName}: ${updated.startTime} - ${updated.endTime}). Status: ${updated.status}. Contact: ${updated.phone}`,
        updated.id
      )
    }

    emitLiveSocketEvent('duty:roster-updated', {
      action: 'UPDATED',
      duty: updated,
      message: `${updated.staffName} duty updated at ${updated.locationPost}`,
    })

    return NextResponse.json({ success: true, duty: updated })
  } catch (err: any) {
    console.error('Error updating staff duty:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// PATCH /api/staff/duty — Quick toggle duty status or post
export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 })
    }

    const orgId = user.organizationId!
    const body = await request.json()
    const { id, status, locationPost, shiftName } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const updated = await prisma.staffDuty.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(locationPost && { locationPost }),
        ...(shiftName && { shiftName }),
      },
    })

    await broadcastDutyNotification(
      orgId,
      `🛡️ Guard Status Changed: ${updated.staffName}`,
      `${updated.staffName} at ${updated.locationPost} is now marked ${updated.status}.`,
      updated.id
    )

    emitLiveSocketEvent('duty:roster-updated', {
      action: 'PATCHED',
      duty: updated,
    })

    return NextResponse.json({ success: true, duty: updated })
  } catch (err: any) {
    console.error('Error patching staff duty:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// DELETE /api/staff/duty — Remove duty assignment (Admin only)
export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 })
    }

    const orgId = user.organizationId!
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const deleted = await prisma.staffDuty.delete({
      where: { id },
    })

    emitLiveSocketEvent('duty:roster-updated', {
      action: 'DELETED',
      id,
    })

    return NextResponse.json({ success: true, deleted })
  } catch (err: any) {
    console.error('Error deleting staff duty:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
