import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { notifyUsers } from '@/lib/socket-server'
import { clearSalaryMarkedPaidByExpense, staffCreditsFor } from '@/app/api/staff/route'
import fs from 'fs'
import path from 'path'

function readStoredStaffMatch(orgId: string, phone?: string | null, name?: string | null) {
  try {
    const file = path.join(process.cwd(), 'staff_store.json')
    if (!fs.existsSync(file)) return null
    const all = JSON.parse(fs.readFileSync(file, 'utf-8'))
    const staff = all?.[orgId]?.staff
    if (!Array.isArray(staff)) return null
    const needle = usablePhone(phone)
    const byPhone = needle
      ? staff.find((row: { phone?: string }) => usablePhone(row.phone) === needle)
      : null
    if (byPhone) return byPhone
    const wanted = String(name || '').trim().toLowerCase()
    if (!wanted) return null
    return staff.find((row: { name?: string }) => String(row.name || '').trim().toLowerCase() === wanted) || null
  } catch {
    return null
  }
}

export const dynamic = 'force-dynamic'

function usablePhone(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length < 10) return ''
  return digits.slice(-10)
}

async function attachHostContact<T extends { organizationId: string; residentUnit: string; residentName?: string | null; residentPhone?: string | null }>(passes: T[]) {
  if (!passes.length) return passes
  const orgId = passes[0].organizationId
  const unitNumbers = [...new Set(passes.map((pass) => pass.residentUnit).filter(Boolean))]
  const [units, people] = await Promise.all([
    prisma.unit.findMany({
      where: { organizationId: orgId, unitNumber: { in: unitNumbers } },
      select: { unitNumber: true, ownerName: true, ownerPhone: true, tenantName: true, tenantPhone: true },
    }),
    prisma.user.findMany({
      where: { organizationId: orgId, unit: { unitNumber: { in: unitNumbers } } },
      select: { name: true, phone: true, unit: { select: { unitNumber: true } } },
    }),
  ])
  return passes.map((pass) => {
    const unit = units.find((row) => row.unitNumber === pass.residentUnit)
    const person = people.find((row) => row.unit?.unitNumber === pass.residentUnit)
    const phone = usablePhone(pass.residentPhone) || usablePhone(person?.phone) || usablePhone(unit?.tenantPhone) || usablePhone(unit?.ownerPhone)
    const storedName = pass.residentName && pass.residentName !== 'Resident' ? pass.residentName : ''
    const name = storedName || person?.name || unit?.tenantName || unit?.ownerName || 'Resident'
    return { ...pass, residentName: name, residentPhone: phone || pass.residentPhone || '' }
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phoneParam = searchParams.get('phone')?.trim()

    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const organizationId = user.organizationId
    const staffPhone = user.role === 'STAFF' ? user.phone : (phoneParam || user.phone)

    if (!organizationId) {
      return NextResponse.json({ success: true, society: null, staff: null, salary: null, passes: { activeCount: 0, checkedInCount: 0, completedCount: 0, totalToday: 0, list: [] } })
    }

    console.log('[STAFF PORTAL API] organizationId:', organizationId)
    await clearSalaryMarkedPaidByExpense(organizationId)

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, address: true, city: true },
    })

    // Find the staff duty record for this staff member
    let staffMember = null
    if (staffPhone) {
      const cleanPhone = staffPhone.replace(/\D/g, '')
      const tenDigit = cleanPhone.slice(-10)
      staffMember = await prisma.staffDuty.findFirst({
        where: {
          organizationId,
          OR: [
            { phone: staffPhone },
            { phone: cleanPhone },
            { phone: tenDigit },
            { phone: { contains: tenDigit } },
          ],
        },
      })
    }

    // Try finding by user name if role is STAFF
    if (!staffMember && user?.name) {
      staffMember = await prisma.staffDuty.findFirst({
        where: {
          organizationId,
          staffName: user.name,
        },
      })
    }

    // Default to first Security Guard in organization if not matched
    // If no staff member duty record exists yet, provide an active guard context without writing dummy records to DB
    const activeStaff = staffMember || {
      id: "default",
      staffName: user?.name || "Gate Security Guard",
      role: "Security Guard",
      category: "SECURITY",
      phone: staffPhone || "—",
      altPhone: null,
      locationPost: "",
      blockName: "",
      shiftName: "",
      startTime: "",
      endTime: "",
      status: "ON_DUTY",
      salaryAmount: 0,
      salaryDate: "",
      paymentStatus: "",
      lastPaidDate: "",
      attendancePresent: 0,
      attendanceTotal: 0,
      notes: null,
    }

    // Fetch gate entry passes for this staff member's gate post
    const allPasses = await attachHostContact(await prisma.entryPass.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    }))

    // Active passes for verification
    const activePasses = allPasses.filter(p => p.status === "APPROVED" || p.status === "CHECKED_IN")
    const checkedInPasses = allPasses.filter(p => p.status === "CHECKED_IN")
    const completedPasses = allPasses.filter(p => p.status === "CHECKED_OUT")

    // Find supervisor
    const supervisor = await prisma.staffDuty.findFirst({
      where: { organizationId, category: "SUPERVISOR" },
    })

    // Find relief guard
    const reliefGuard = staffMember ? await prisma.staffDuty.findFirst({
      where: {
        organizationId,
        category: "SECURITY",
        id: { not: staffMember.id },
      },
    }) : null

    const sampleDutyNames = new Set([
      'Ram Singh', 'Dharmendra Kumar', 'Bijender Yadav', 'Manoj Tiwari', 'Suraj Sharma',
      'Ramesh Paswan', 'Sunita Devi', 'Rekha Rani', 'Mahesh Electrician', 'Shankar Plumber', 'Radhey Shyam',
    ])
    const realSupervisor = supervisor && !sampleDutyNames.has(supervisor.staffName) ? supervisor : null
    const realRelief = reliefGuard && !sampleDutyNames.has(reliefGuard.staffName) ? reliefGuard : null

    const storedStaff = readStoredStaffMatch(organizationId, activeStaff.phone, activeStaff.staffName)
    const shiftLabels: Record<string, string> = {
      DAY: 'Day Shift',
      NIGHT: 'Night Shift',
      ROTATIONAL: 'Rotational',
      GENERAL: 'General Shift',
    }
    const inventedPosts = new Set(['Gate 1 Entrance Desk', 'Gate 1 - Main Entrance', 'Gate 1 - Main Entrance Desk'])
    const hasSavedPost = (row: { locationPost?: string | null; staffName?: string | null }) => {
      const post = row.locationPost || ''
      return !!post && post !== 'Not assigned' && !inventedPosts.has(post) && !sampleDutyNames.has(row.staffName || '')
    }
    const savedDuties = await prisma.staffDuty.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
    })
    const ownDuty = staffMember && hasSavedPost(staffMember) ? staffMember : null
    const shownDuty = ownDuty || savedDuties.find((row) => hasSavedPost(row)) || activeStaff
    const shownStored = readStoredStaffMatch(organizationId, shownDuty.phone, shownDuty.staffName) || storedStaff
    const shiftName = shownDuty.shiftName
      || (shownStored ? (shiftLabels[shownStored.shift] || '') : '')
    const startTime = shownDuty.startTime || ''
    const endTime = shownDuty.endTime || ''
    const locationPost = inventedPosts.has(shownDuty.locationPost || '') || shownDuty.locationPost === 'Not assigned'
      ? ''
      : (shownDuty.locationPost || '')
    const monthlySalary = Number(shownDuty.salaryAmount) || Number(shownStored?.salary) || 0
    const credits = staffCreditsFor(organizationId, shownDuty.phone, shownDuty.staffName)
    const latestCredit = credits[0]
    let nextSalaryCredit = ''
    if (latestCredit?.paidAt) {
      const next = new Date(latestCredit.paidAt)
      if (!Number.isNaN(next.getTime())) {
        next.setMonth(next.getMonth() + 1)
        nextSalaryCredit = next.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      }
    }
    const payDateIsDefault = !latestCredit && (!shownDuty.salaryDate || shownDuty.salaryDate === '5th of every month' || shownDuty.salaryDate === '—')
    const attendanceIsDefault = shownDuty.attendancePresent === 26 && shownDuty.attendanceTotal === 28
    const attendancePresent = attendanceIsDefault ? 0 : (shownDuty.attendancePresent || 0)
    const attendanceTotal = attendanceIsDefault ? 0 : (shownDuty.attendanceTotal || 0)
    const blockName = shownDuty.blockName && shownDuty.blockName !== 'Campus Wide' ? shownDuty.blockName : ''
    let handover: { supervisorName?: string; supervisorPhone?: string; reliefName?: string; reliefPhone?: string; portalAccess?: string[]; rounds?: Record<string, { date?: string; done?: string[] }> } = {}
    try {
      if (shownDuty.notes && shownDuty.notes.trim().startsWith('{')) handover = JSON.parse(shownDuty.notes)
    } catch { handover = {} }
    const categoryDefaults: Record<string, string[]> = {
      SECURITY: ['gate', 'visitors', 'shift', 'salary', 'intercom'],
      HOUSEKEEPING: ['cleaning', 'jobs', 'shift', 'salary', 'intercom'],
      GARDENING: ['garden', 'jobs', 'shift', 'salary', 'intercom'],
      OFFICE: ['office', 'jobs', 'shift', 'salary', 'intercom'],
      MAINTENANCE: ['jobs', 'shift', 'salary', 'intercom'],
    }
    const storedAccess = Array.isArray((shownStored as { portalAccess?: string[] } | null)?.portalAccess)
      ? (shownStored as { portalAccess?: string[] }).portalAccess
      : null
    const notedAccess = Array.isArray(handover.portalAccess) ? handover.portalAccess : null
    const portalAccess = (notedAccess && notedAccess.length ? notedAccess : storedAccess) || categoryDefaults[shownDuty.category] || categoryDefaults.MAINTENANCE
    const namedSupervisor = handover.supervisorName ? {
      name: handover.supervisorName,
      role: 'Supervisor',
      phone: handover.supervisorPhone || '',
    } : null
    const namedRelief = handover.reliefName ? {
      name: handover.reliefName,
      role: 'Relief guard',
      phone: handover.reliefPhone || '',
      shift: '',
    } : null

    return NextResponse.json({
      success: true,
      society: {
        id: org?.id,
        name: org?.name || "Society Campus",
        address: org?.address || "Campus Gates & Towers",
        city: org?.city,
      },
      staff: {
        id: shownDuty.id,
        name: shownDuty.staffName,
        role: shownDuty.role,
        category: shownDuty.category,
        phone: shownDuty.phone,
        altPhone: shownDuty.altPhone,
        locationPost,
        blockName,
        shiftName,
        startTime,
        endTime,
        status: shownDuty.status,
        notes: shownDuty.notes,
        portalAccess,
      },
      rounds: handover.rounds || {},
      duty: {
        currentPost: locationPost,
        currentBlock: blockName,
        currentShift: shiftName,
        timing: startTime && endTime ? `${startTime} – ${endTime}` : '',
        status: shownDuty.status,
        supervisor: namedSupervisor || (realSupervisor && realSupervisor.id !== shownDuty.id ? {
          name: realSupervisor.staffName,
          role: realSupervisor.role,
          phone: realSupervisor.phone,
        } : null),
        reliefGuard: namedRelief || (realRelief && realRelief.id !== shownDuty.id ? {
          name: realRelief.staffName,
          role: realRelief.role,
          phone: realRelief.phone,
          shift: realRelief.shiftName || '',
        } : null),
      },
      salary: {
        monthlySalary,
        salaryDate: latestCredit?.paidLabel || (payDateIsDefault ? '' : shownDuty.salaryDate),
        nextSalaryCredit,
        paymentStatus: credits.length ? 'PAID' : (shownDuty.lastPaidDate ? (shownDuty.paymentStatus || '') : ''),
        lastPaidDate: latestCredit?.paidLabel || shownDuty.lastPaidDate || '',
        creditCount: credits.length,
        totalCredited: credits.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
        credits,
        bankAccount: shownStored?.upiId || shownStored?.accountNumber || '',
        attendancePresent,
        attendanceTotal,
        attendancePercent: attendanceTotal ? Math.round((attendancePresent / attendanceTotal) * 100) : 0,
        breakdown: {
          basicSalary: monthlySalary,
          shiftAllowance: 0,
          specialDutyBonus: 0,
          pfEsiDeduction: 0,
          netSalary: monthlySalary,
        },
      },
      passes: {
        activeCount: activePasses.length,
        checkedInCount: checkedInPasses.length,
        completedCount: completedPasses.length,
        totalToday: allPasses.length,
        list: allPasses,
      },
    })
  } catch (error: any) {
    console.error('Error fetching staff portal details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch staff portal data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user || !['STAFF', 'RWA_ADMIN', 'TREASURER'].includes(user.role)) {
      return NextResponse.json({ error: 'Only security or the society admin can verify a pass' }, { status: 403 })
    }
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No society is attached to this account' }, { status: 400 })
    }

    const body = await request.json()
    const { action, passCodeOrPin, passId, guardName, locationPost } = body

    if (action === 'save_round' || action === 'update_job') {
      const duty = await prisma.staffDuty.findFirst({
        where: { id: String(body.dutyId || ''), organizationId: user.organizationId },
      })
      if (!duty) return NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
      let notes: Record<string, unknown> = {}
      try {
        if (duty.notes && duty.notes.trim().startsWith('{')) notes = JSON.parse(duty.notes)
      } catch { notes = {} }

      if (action === 'save_round') {
        const kind = body.kind === 'garden' ? 'garden' : 'cleaning'
        const done = Array.isArray(body.done) ? body.done.map((item: unknown) => String(item)).slice(0, 20) : []
        const rounds = (notes.rounds && typeof notes.rounds === 'object') ? notes.rounds as Record<string, unknown> : {}
        rounds[kind] = { date: new Date().toISOString().slice(0, 10), done }
        notes.rounds = rounds
        await prisma.staffDuty.update({ where: { id: duty.id }, data: { notes: JSON.stringify(notes) } })
        return NextResponse.json({ success: true, rounds })
      }

      const access = Array.isArray(notes.portalAccess) ? notes.portalAccess.map(String) : []
      const canUpdateJobs = user.role !== 'STAFF' || access.includes('jobs') || access.includes('office') || access.length === 0
      if (!canUpdateJobs) return NextResponse.json({ error: 'This staff member cannot update work orders' }, { status: 403 })
      const nextStatus = body.status === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS'
      const complaint = await prisma.complaint.findFirst({
        where: { id: String(body.complaintId || ''), organizationId: user.organizationId },
      })
      if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
      const updatedComplaint = await prisma.complaint.update({
        where: { id: complaint.id },
        data: {
          status: nextStatus,
          assignedTo: user.name || duty.staffName,
          resolvedAt: nextStatus === 'RESOLVED' ? new Date() : null,
        },
      })
      await notifyUsers({
        orgId: user.organizationId,
        roles: ['admin'],
        userIds: [complaint.raisedById],
        excludeUserId: user.id,
        title: nextStatus === 'RESOLVED' ? `Ticket resolved: ${complaint.title}` : `Ticket in progress: ${complaint.title}`,
        message: `${user.name || duty.staffName} updated ${complaint.ticketNumber}.`,
        type: 'COMPLAINT',
        event: 'complaint-updated',
        referenceType: 'COMPLAINT',
        referenceId: complaint.id,
      }).catch(() => {})
      return NextResponse.json({ success: true, complaint: updatedComplaint })
    }

    if (action === 'quick_verify') {
      const code = (passCodeOrPin || '').trim()
      if (!code) {
        return NextResponse.json({ error: 'Please enter Pass Code or 4-digit PIN' }, { status: 400 })
      }

      const pass = await prisma.entryPass.findFirst({
        where: {
          organizationId: user.organizationId,
          OR: [
            { passCode: code },
            { passCode: `PASS-${code}` },
            { otpPin: code },
          ],
        },
      })

      if (!pass) {
        return NextResponse.json({
          error: `No visiting pass found for code/PIN "${code}". Please check with visitor or verify flat.`,
        }, { status: 404 })
      }

      const [passWithHost] = await attachHostContact([pass])

      if (pass.status === 'CHECKED_IN') {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          pass: passWithHost,
          message: `Visitor ${pass.visitorName} is already checked in at ${pass.gateNumber}.`,
        })
      }

      // Mark as checked in
      const now = new Date()
      const updatedPass = await prisma.entryPass.update({
        where: { id: pass.id },
        data: {
          status: 'CHECKED_IN',
          checkedInAt: now,
          checkedInBy: guardName || 'Gate Security Guard',
          gateNumber: locationPost || pass.gateNumber,
        },
      })

      const flatResidents = await prisma.user.findMany({
        where: { organizationId: pass.organizationId, unit: { unitNumber: pass.residentUnit } },
        select: { id: true },
      })
      await notifyUsers({
        orgId: pass.organizationId,
        roles: ['admin'],
        userIds: flatResidents.map((person) => person.id),
        excludeUserId: user.id,
        title: `Visitor arrived: ${pass.visitorName}`,
        message: `${pass.visitorName} checked in at ${locationPost || pass.gateNumber} for flat ${pass.residentUnit}.`,
        type: 'VISITOR_ALERT',
        event: 'passes:updated',
        referenceType: 'EntryPass',
        referenceId: pass.id,
        data: { action: 'CHECKED_IN', pass: updatedPass },
      })

      const [checkedInView] = await attachHostContact([updatedPass])
      return NextResponse.json({
        success: true,
        pass: checkedInView,
        message: `✅ Entry Granted: ${pass.visitorName} checked in for Flat ${pass.residentUnit}!`,
      })
    }

    if (action === 'quick_checkout') {
      if (!passId) {
        return NextResponse.json({ error: 'Pass ID is required' }, { status: 400 })
      }

      const pass = await prisma.entryPass.findFirst({
        where: { id: passId, organizationId: user.organizationId },
      })
      if (!pass) {
        return NextResponse.json({ error: 'Entry pass not found in this society' }, { status: 404 })
      }

      const now = new Date()
      const updatedPass = await prisma.entryPass.update({
        where: { id: pass.id },
        data: {
          status: 'CHECKED_OUT',
          checkedOutAt: now,
          checkedOutBy: guardName || 'Gate Security Guard',
        },
      })

      const checkoutResidents = await prisma.user.findMany({
        where: { organizationId: pass.organizationId, unit: { unitNumber: pass.residentUnit } },
        select: { id: true },
      })
      await notifyUsers({
        orgId: pass.organizationId,
        roles: ['admin'],
        userIds: checkoutResidents.map((person) => person.id),
        excludeUserId: user.id,
        title: `Visitor left: ${updatedPass.visitorName}`,
        message: `${updatedPass.visitorName} checked out from flat ${updatedPass.residentUnit}.`,
        type: 'VISITOR_ALERT',
        event: 'passes:updated',
        referenceType: 'EntryPass',
        referenceId: updatedPass.id,
        data: { action: 'CHECKED_OUT', pass: updatedPass },
      })

      return NextResponse.json({
        success: true,
        pass: updatedPass,
        message: `Visitor ${updatedPass.visitorName} marked as checked out.`,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error in staff portal action:', error)
    return NextResponse.json(
      { error: error.message || 'Staff portal action failed' },
      { status: 500 }
    )
  }
}
