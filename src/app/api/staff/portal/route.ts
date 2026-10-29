import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

function getIO() {
  if (typeof global !== 'undefined' && (global as any).__io) {
    return (global as any).__io
  }
  return null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phoneParam = searchParams.get('phone')?.trim()

    let organizationId = searchParams.get('orgId') || null
    let staffPhone = phoneParam

    if (!staffPhone) {
      const { user } = await requireAuth(request).catch(() => ({ user: null }))
      if (user) {
        staffPhone = user.phone
        organizationId = user.organizationId || null
      }
    }

    if (!organizationId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      organizationId = firstOrg?.id || null
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    // Find the staff duty record for this staff member
    let staffMember = null
    if (staffPhone) {
      staffMember = await prisma.staffDuty.findFirst({
        where: {
          organizationId,
          OR: [
            { phone: staffPhone },
            { phone: { contains: staffPhone.slice(-10) } },
          ],
        },
      })
    }

    // Default to Senior Security Guard Ram Singh if not found
    if (!staffMember) {
      staffMember = await prisma.staffDuty.findFirst({
        where: { organizationId, category: 'SECURITY' },
        orderBy: { order: 'asc' },
      })
    }

    // Fallback if staff table is completely empty
    if (!staffMember) {
      staffMember = await prisma.staffDuty.create({
        data: {
          organizationId,
          staffName: 'Ram Singh',
          role: 'Senior Security Guard',
          category: 'SECURITY',
          phone: '9876543210',
          locationPost: 'Gate 1 - Main Entrance',
          blockName: 'Main Gate',
          shiftName: 'Morning Shift',
          startTime: '06:00 AM',
          endTime: '02:00 PM',
          status: 'ON_DUTY',
          salaryAmount: 22500,
          salaryDate: '5th of every month',
          paymentStatus: 'PAID',
          lastPaidDate: '05 Oct 2026',
          attendancePresent: 26,
          attendanceTotal: 28,
        },
      })
    }

    // Fetch gate entry passes for this staff member's gate post
    const allPasses = await prisma.entryPass.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })

    // Active passes for verification
    const activePasses = allPasses.filter(p => p.status === 'APPROVED' || p.status === 'CHECKED_IN')
    const checkedInPasses = allPasses.filter(p => p.status === 'CHECKED_IN')
    const completedPasses = allPasses.filter(p => p.status === 'CHECKED_OUT')

    // Find supervisor
    const supervisor = await prisma.staffDuty.findFirst({
      where: { organizationId, category: 'SUPERVISOR' },
    }) || {
      staffName: 'Ramesh Paswan',
      role: 'Facility & Security Supervisor',
      phone: '9876543215',
    }

    // Find relief guard
    const reliefGuard = await prisma.staffDuty.findFirst({
      where: {
        organizationId,
        category: 'SECURITY',
        id: { not: staffMember.id },
      },
    }) || {
      staffName: 'Dharmendra Kumar',
      role: 'Evening Relief Guard (Gate 1)',
      phone: '9876543211',
      shiftName: 'Evening Shift (02:00 PM - 10:00 PM)',
    }

    // Salary slip calculation
    const basePay = Math.round((staffMember.salaryAmount || 22500) * 0.75)
    const allowance = Math.round((staffMember.salaryAmount || 22500) * 0.15)
    const dutyBonus = (staffMember.salaryAmount || 22500) - basePay - allowance
    const pfDeduction = 1250
    const netTakeHome = (staffMember.salaryAmount || 22500) - pfDeduction

    return NextResponse.json({
      success: true,
      staff: {
        id: staffMember.id,
        name: staffMember.staffName,
        role: staffMember.role,
        category: staffMember.category,
        phone: staffMember.phone,
        altPhone: staffMember.altPhone,
        locationPost: staffMember.locationPost,
        blockName: staffMember.blockName,
        shiftName: staffMember.shiftName,
        startTime: staffMember.startTime,
        endTime: staffMember.endTime,
        status: staffMember.status,
        notes: staffMember.notes,
      },
      duty: {
        currentPost: staffMember.locationPost,
        currentBlock: staffMember.blockName || 'Campus Wide',
        currentShift: staffMember.shiftName,
        timing: `${staffMember.startTime} – ${staffMember.endTime}`,
        status: staffMember.status,
        supervisor: {
          name: supervisor.staffName,
          role: supervisor.role,
          phone: supervisor.phone,
        },
        reliefGuard: {
          name: reliefGuard.staffName,
          role: reliefGuard.role,
          phone: reliefGuard.phone,
          shift: reliefGuard.shiftName || '02:00 PM - 10:00 PM',
        },
      },
      salary: {
        monthlySalary: staffMember.salaryAmount || 22500,
        salaryDate: staffMember.salaryDate || '5th of every month',
        nextSalaryCredit: '05 Nov 2026',
        paymentStatus: staffMember.paymentStatus || 'PAID',
        lastPaidDate: staffMember.lastPaidDate || '05 Oct 2026',
        bankAccount: 'State Bank of India (••• 4128)',
        attendancePresent: staffMember.attendancePresent || 26,
        attendanceTotal: staffMember.attendanceTotal || 28,
        attendancePercent: Math.round(((staffMember.attendancePresent || 26) / (staffMember.attendanceTotal || 28)) * 100),
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
    const body = await request.json()
    const { action, passCodeOrPin, passId, guardName, locationPost } = body

    if (action === 'quick_verify') {
      const code = (passCodeOrPin || '').trim()
      if (!code) {
        return NextResponse.json({ error: 'Please enter Pass Code or 4-digit PIN' }, { status: 400 })
      }

      // Search pass by passCode or otpPin or phone
      const pass = await prisma.entryPass.findFirst({
        where: {
          OR: [
            { passCode: code },
            { passCode: `PASS-${code}` },
            { otpPin: code },
            { visitorPhone: code },
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

      // Notify resident
      if (pass.organizationId) {
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
                title: `🔔 Visitor Checked In: ${pass.visitorName}`,
                message: `Your guest ${pass.visitorName} (${pass.visitorType}) was verified & checked in at ${locationPost || pass.gateNumber} by guard ${guardName || 'Security'}.`,
                type: 'VISITOR_ALERT',
                referenceType: 'EntryPass',
                referenceId: pass.id,
              })),
            })
          }
        } catch (e) {
          console.warn('Could not dispatch resident notification:', e)
        }
      }

      const io = getIO()
      if (io) {
        io.emit('passes:updated', {
          action: 'CHECKED_IN',
          pass: updatedPass,
        })
      }

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

      const now = new Date()
      const updatedPass = await prisma.entryPass.update({
        where: { id: passId },
        data: {
          status: 'CHECKED_OUT',
          checkedOutAt: now,
          checkedOutBy: guardName || 'Gate Security Guard',
        },
      })

      const io = getIO()
      if (io) {
        io.emit('passes:updated', {
          action: 'CHECKED_OUT',
          pass: updatedPass,
        })
      }

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
