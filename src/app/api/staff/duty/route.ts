import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin, hashPassword } from '@/lib/auth'
import { notifyUsers } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'

const SAMPLE_STAFF_PHONES = [
  '9876543231', '9876543232', '9876543233', '9876543234', '9876543235',
  '9876543236', '9876543237', '9876543238', '9876543239', '9876543240', '9876543241',
]
const SAMPLE_STAFF_NAMES = [
  'Ram Singh', 'Dharmendra Kumar', 'Bijender Yadav', 'Manoj Tiwari', 'Suraj Sharma',
  'Ramesh Paswan', 'Sunita Devi', 'Rekha Rani', 'Mahesh Electrician', 'Shankar Plumber', 'Radhey Shyam',
]

async function removeSampleStaff(orgId: string) {
  await prisma.staffDuty.deleteMany({
    where: {
      organizationId: orgId,
      OR: [
        { phone: { in: SAMPLE_STAFF_PHONES } },
        { staffName: { in: SAMPLE_STAFF_NAMES } },
      ],
    },
  })

  const dummyUsers = await prisma.user.findMany({
    where: {
      organizationId: orgId,
      role: 'STAFF',
      OR: [
        { phone: { in: SAMPLE_STAFF_PHONES } },
        { name: { in: SAMPLE_STAFF_NAMES } },
      ],
    },
    select: { id: true },
  })
  const ids = dummyUsers.map((u) => u.id)
  if (ids.length === 0) return

  await prisma.payment.updateMany({ where: { userId: { in: ids } }, data: { userId: null } })
  await prisma.complaint.deleteMany({ where: { raisedById: { in: ids } } })
  await prisma.document.deleteMany({ where: { uploadedById: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
}

// Helper to broadcast notification to all residents in organization
async function broadcastDutyNotification(
  orgId: string,
  title: string,
  message: string,
  dutyId: string
) {
  try {
    await notifyUsers({
      orgId,
      roles: ['admin', 'resident', 'staff'],
      title,
      message,
      type: 'STAFF_DUTY',
      event: 'duty:roster-updated',
      referenceType: 'STAFF_DUTY',
      referenceId: dutyId,
      data: { message, dutyId },
    })
  } catch (err) {
    console.error('Error broadcasting duty notification:', err)
  }
}

// GET /api/staff/duty — Fetch duty roster for society
export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    if (!user.organizationId) return NextResponse.json({ success: true, duties: [], metrics: {} })
    const orgId = user.organizationId
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const blockName = searchParams.get('blockName')

    await removeSampleStaff(orgId)

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

    if (body.action === 'RESET_DEFAULTS') {
      await removeSampleStaff(orgId)
      const duties = await prisma.staffDuty.findMany({ where: { organizationId: orgId } })
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
      shiftName = '',
      startTime = '',
      endTime = '',
      status = 'ON_DUTY',
      pin = '1234',
      salaryAmount = 0,
      salaryDate = '',
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

    const cleanPhone = phone.trim().replace(/\D/g, '')
    const tenDigit = cleanPhone.slice(-10)

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
        salaryAmount: Number(salaryAmount) || 0,
        salaryDate: salaryDate ? String(salaryDate).trim() : '',
        paymentStatus: '',
        attendancePresent: 0,
        attendanceTotal: 0,
        isEmergencyContact: Boolean(isEmergencyContact),
        notes: notes ? notes.trim() : null,
      },
    })

    // Create or update real User account so guard/staff can immediately log in
    try {
      const pinToUse = pin ? String(pin).trim() : '1234'
      const hashedPin = await hashPassword(pinToUse)

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: tenDigit },
          ],
        },
      })

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: staffName.trim(),
            role: 'STAFF',
            organizationId: orgId,
            status: status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
            passwordHash: hashedPin,
          },
        })
      } else {
        await prisma.user.create({
          data: {
            phone: tenDigit,
            name: staffName.trim(),
            role: 'STAFF',
            status: status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
            passwordHash: hashedPin,
            organizationId: orgId,
          },
        })
      }
    } catch (userSyncErr) {
      console.error('Error syncing User account for new staff:', userSyncErr)
    }

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

    let handoverNotes = existing.notes
    if (updates.supervisorName !== undefined || updates.reliefName !== undefined) {
      let previous: Record<string, string> = {}
      try {
        if (existing.notes && existing.notes.trim().startsWith('{')) previous = JSON.parse(existing.notes)
        else if (existing.notes) previous = { note: existing.notes }
      } catch {
        previous = existing.notes ? { note: existing.notes } : {}
      }
      handoverNotes = JSON.stringify({
        ...previous,
        supervisorName: updates.supervisorName ? String(updates.supervisorName).trim() : '',
        supervisorPhone: updates.supervisorPhone ? String(updates.supervisorPhone).trim() : '',
        reliefName: updates.reliefName ? String(updates.reliefName).trim() : '',
        reliefPhone: updates.reliefPhone ? String(updates.reliefPhone).trim() : '',
      })
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
        ...(updates.salaryAmount !== undefined && { salaryAmount: Number(updates.salaryAmount) }),
        ...((updates.supervisorName !== undefined || updates.reliefName !== undefined) && { notes: handoverNotes }),
        ...(updates.salaryDate && { salaryDate: updates.salaryDate.trim() }),
        ...(updates.isEmergencyContact !== undefined && { isEmergencyContact: Boolean(updates.isEmergencyContact) }),
        ...(updates.notes !== undefined && { notes: updates.notes ? updates.notes.trim() : null }),
      },
    })

    // Sync User account credentials (name, phone, status, and optional new PIN)
    try {
      const phoneToSync = (updates.phone || existing.phone).trim().replace(/\D/g, '')
      const tenDigit = phoneToSync.slice(-10)

      let userUpdateData: any = {
        organizationId: orgId,
        status: (updates.status || existing.status) === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
      }
      if (updates.staffName) userUpdateData.name = updates.staffName.trim()
      if (updates.pin && String(updates.pin).trim()) {
        userUpdateData.passwordHash = await hashPassword(String(updates.pin).trim())
      }

      const staffUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phoneToSync },
            { phone: tenDigit },
          ],
        },
      })

      if (staffUser) {
        await prisma.user.update({
          where: { id: staffUser.id },
          data: userUpdateData,
        })
      } else if (updates.pin) {
        await prisma.user.create({
          data: {
            phone: tenDigit,
            name: updated.staffName,
            role: 'STAFF',
            status: updated.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
            passwordHash: await hashPassword(String(updates.pin).trim()),
            organizationId: orgId,
          },
        })
      }
    } catch (userErr) {
      console.error('Error syncing staff User during PUT:', userErr)
    }

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

    // If status changed to suspended or active, sync user
    if (status && updated.phone) {
      const tenDigit = updated.phone.replace(/\D/g, '').slice(-10)
      const u = await prisma.user.findFirst({
        where: {
          organizationId: orgId,
          role: 'STAFF',
          OR: [{ phone: updated.phone }, { phone: tenDigit }],
        },
      })
      if (u) {
        await prisma.user.update({
          where: { id: u.id },
          data: { status: status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE' },
        })
      }
    }

    await broadcastDutyNotification(
      orgId,
      `🛡️ Guard Status Changed: ${updated.staffName}`,
      `${updated.staffName} at ${updated.locationPost} is now marked ${updated.status}.`,
      updated.id
    )

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

    // Deactivate associated staff user account
    if (deleted.phone) {
      const tenDigit = deleted.phone.replace(/\D/g, '').slice(-10)
      const u = await prisma.user.findFirst({
        where: {
          organizationId: orgId,
          role: 'STAFF',
          OR: [{ phone: deleted.phone }, { phone: tenDigit }],
        },
      })
      if (u) {
        await prisma.user.update({
          where: { id: u.id },
          data: { status: 'SUSPENDED' },
        })
      }
    }

    await notifyUsers({
      orgId,
      roles: ['admin', 'staff'],
      title: 'Duty removed from the roster',
      message: 'A staff duty post was removed.',
      type: 'STAFF_DUTY',
      event: 'duty:roster-updated',
      data: { action: 'DELETED', id, message: 'A staff duty post was removed.' },
    })

    return NextResponse.json({ success: true, deleted })
  } catch (err: any) {
    console.error('Error deleting staff duty:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
