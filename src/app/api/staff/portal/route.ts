import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { notifyUsers } from '@/lib/socket-server'

export const dynamic = 'force-dynamic'

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
      locationPost: "Gate 1 - Main Entrance",
      blockName: "Main Gate",
      shiftName: "General Duty",
      startTime: "08:00 AM",
      endTime: "08:00 PM",
      status: "ON_DUTY",
      salaryAmount: 0,
      salaryDate: "—",
      paymentStatus: "—",
      lastPaidDate: "—",
      attendancePresent: 0,
      attendanceTotal: 0,
      notes: null,
    }

    // Fetch gate entry passes for this staff member's gate post
    const allPasses = await prisma.entryPass.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    })

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

    // Salary slip calculation
    const basePay = activeStaff.salaryAmount ? Math.round(activeStaff.salaryAmount * 0.75) : 0
    const allowance = activeStaff.salaryAmount ? Math.round(activeStaff.salaryAmount * 0.15) : 0
    const dutyBonus = activeStaff.salaryAmount ? activeStaff.salaryAmount - basePay - allowance : 0
    const pfDeduction = activeStaff.salaryAmount ? 1250 : 0
    const netTakeHome = activeStaff.salaryAmount ? activeStaff.salaryAmount - pfDeduction : 0

    return NextResponse.json({
      success: true,
      society: {
        id: org?.id,
        name: org?.name || "Society Campus",
        address: org?.address || "Campus Gates & Towers",
        city: org?.city,
      },
      staff: {
        id: activeStaff.id,
        name: activeStaff.staffName,
        role: activeStaff.role,
        category: activeStaff.category,
        phone: activeStaff.phone,
        altPhone: activeStaff.altPhone,
        locationPost: activeStaff.locationPost,
        blockName: activeStaff.blockName,
        shiftName: activeStaff.shiftName,
        startTime: activeStaff.startTime,
        endTime: activeStaff.endTime,
        status: activeStaff.status,
        notes: activeStaff.notes,
      },
      duty: {
        currentPost: activeStaff.locationPost,
        currentBlock: activeStaff.blockName || "Campus Wide",
        currentShift: activeStaff.shiftName,
        timing: `${activeStaff.startTime || "08:00 AM"} – ${activeStaff.endTime || "08:00 PM"}`,
        status: activeStaff.status,
        supervisor: supervisor ? {
          name: supervisor.staffName,
          role: supervisor.role,
          phone: supervisor.phone,
        } : null,
        reliefGuard: reliefGuard ? {
          name: reliefGuard.staffName,
          role: reliefGuard.role,
          phone: reliefGuard.phone,
          shift: reliefGuard.shiftName || "02:00 PM - 10:00 PM",
        } : null,
      },
      salary: {
        monthlySalary: activeStaff.salaryAmount || 0,
        salaryDate: activeStaff.salaryDate || "—",
        nextSalaryCredit: "—",
        paymentStatus: activeStaff.paymentStatus || "—",
        lastPaidDate: activeStaff.lastPaidDate || "—",
        bankAccount: "Bank Account on record",
        attendancePresent: activeStaff.attendancePresent || 0,
        attendanceTotal: activeStaff.attendanceTotal || 0,
        attendancePercent: activeStaff.attendanceTotal ? Math.round(((activeStaff.attendancePresent || 0) / (activeStaff.attendanceTotal || 1)) * 100) : 0,
        breakdown: {
          basicSalary: basePay,
          shiftAllowance: allowance,
          specialDutyBonus: dutyBonus,
          pfEsiDeduction: pfDeduction,
          netSalary: netTakeHome,
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

      if (pass.status === 'CHECKED_IN') {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          pass,
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

      return NextResponse.json({
        success: true,
        pass: updatedPass,
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
