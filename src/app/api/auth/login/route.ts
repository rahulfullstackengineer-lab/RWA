import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword, createSession, verifyOTP } from '@/lib/auth'
import { findUserByPhone, normalizePhone } from '@/lib/phone'
import fs from 'fs'
import path from 'path'

function findInStaffStore(cleanPhone: string, tenDigit: string) {
  try {
    const p = path.join(process.cwd(), 'staff_store.json')
    if (fs.existsSync(p)) {
      const allData = JSON.parse(fs.readFileSync(p, 'utf-8'))
      for (const orgId of Object.keys(allData)) {
        const staffList = allData[orgId]?.staff || []
        for (const s of staffList) {
          const sClean = (s.phone || '').trim().replace(/\D/g, '')
          const sTen = sClean.slice(-10)
          if (
            (cleanPhone && (sClean === cleanPhone || sTen === cleanPhone || s.phone === cleanPhone)) ||
            (tenDigit && (sClean === tenDigit || sTen === tenDigit || s.phone === tenDigit))
          ) {
            return { staff: s, orgId }
          }
        }
      }
    }
  } catch (e) {
    console.error('Error checking staff store:', e)
  }
  return null
}


export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password, pin, confirmPin, name, action, currentPin, otp } = body
    const secret = (pin || password || '').trim()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const cleanPhone = normalizePhone(phone)
    const tenDigit = cleanPhone || ''
    if (!cleanPhone) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 })
    }

    // ACTION 1: Check phone status (determines if user exists, has PIN, or is first-time)
    if (action === 'check_phone') {
      const matched = await findUserByPhone(cleanPhone)
      const existingUser = matched
        ? await prisma.user.findUnique({
            where: { id: matched.id },
            include: { organization: true, unit: true },
          })
        : null

      if (existingUser) {
        return NextResponse.json({
          success: true,
          exists: true,
          hasPin: Boolean(existingUser.passwordHash),
          isFirstTime: !existingUser.passwordHash,
          name: existingUser.name,
          role: existingUser.role,
          societyName: existingUser.organization?.name || null,
          unitNumber: existingUser.unit?.unitNumber || null,
        })
      }

      // Check if phone exists in Unit directory (pre-provisioned owner/tenant)
      const matchingUnit = await prisma.unit.findFirst({
        where: {
          OR: [
            { ownerPhone: cleanPhone },
            { ownerPhone: tenDigit },
            { tenantPhone: cleanPhone },
            { tenantPhone: tenDigit },
          ],
        },
        include: { organization: true },
      })

      if (matchingUnit) {
        const isTenant = matchingUnit.tenantPhone === cleanPhone || matchingUnit.tenantPhone === tenDigit
        const resName = isTenant
          ? (matchingUnit.tenantName || `Resident ${matchingUnit.unitNumber}`)
          : (matchingUnit.ownerName || `Resident ${matchingUnit.unitNumber}`)

        return NextResponse.json({
          success: true,
          exists: true,
          hasPin: false,
          isFirstTime: true,
          name: resName,
          role: 'RESIDENT',
          societyName: matchingUnit.organization?.name || null,
          unitNumber: matchingUnit.unitNumber,
        })
      }

      // Check if phone belongs to society Staff & Guard Roster
      let matchingStaff = await prisma.staffDuty.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: tenDigit },
          ],
        },
        include: { organization: true },
      })

      if (!matchingStaff) {
        const stored = findInStaffStore(cleanPhone, tenDigit)
        if (stored) {
          return NextResponse.json({
            success: true,
            exists: true,
            hasPin: false,
            isFirstTime: true,
            isStaff: true,
            name: stored.staff.name,
            role: 'STAFF',
            societyName: null,
          })
        }
      }

      if (matchingStaff) {
        return NextResponse.json({
          success: true,
          exists: true,
          hasPin: true,
          isFirstTime: false,
          isStaff: true,
          name: matchingStaff.staffName,
          role: 'STAFF',
          post: matchingStaff.locationPost,
          societyName: matchingStaff.organization?.name || null,
        })
      }

      // Completely new user
      return NextResponse.json({
        success: true,
        exists: false,
        hasPin: false,
        isNewUser: true,
      })
    }

    // ACTION 2: Setup or Reset PIN (strictly mandatory before dashboard access)
    if (action === 'setup_pin' || action === 'reset_pin' || action === 'register') {
      if (!secret || secret.length < 4) {
        return NextResponse.json(
          { error: 'Security PIN must be at least 4 digits' },
          { status: 400 }
        )
      }

      if (confirmPin && secret !== confirmPin.trim()) {
        return NextResponse.json(
          { error: 'PIN and Confirm PIN do not match' },
          { status: 400 }
        )
      }

      const newHash = await hashPassword(secret)

      // Find user
      const matched = await findUserByPhone(cleanPhone)
      let user = matched
        ? await prisma.user.findUnique({
            where: { id: matched.id },
            include: { organization: true, unit: true },
          })
        : null

      if (!user) {
        const storedStaff = findInStaffStore(cleanPhone, tenDigit)
        if (storedStaff) {
          user = await prisma.user.create({
            data: {
              phone: cleanPhone,
              name: name?.trim() || storedStaff.staff.name,
              role: 'STAFF',
              status: 'ACTIVE',
              passwordHash: newHash,
              organizationId: storedStaff.orgId,
            },
            include: { organization: true, unit: true },
          })
        }
      }

      if (!user) {
        const matchingUnit = await prisma.unit.findFirst({
          where: {
            OR: [
              { ownerPhone: cleanPhone },
              { ownerPhone: tenDigit },
              { tenantPhone: cleanPhone },
              { tenantPhone: tenDigit },
            ],
          },
        })

        if (matchingUnit) {
          const isTenant = matchingUnit.tenantPhone === cleanPhone || matchingUnit.tenantPhone === tenDigit
          const resName = name?.trim() || (isTenant
            ? (matchingUnit.tenantName || `Resident ${matchingUnit.unitNumber}`)
            : (matchingUnit.ownerName || `Resident ${matchingUnit.unitNumber}`))

          user = await prisma.user.create({
            data: {
              phone: cleanPhone,
              name: resName,
              role: 'RESIDENT',
              status: 'ACTIVE',
              passwordHash: newHash,
              organizationId: matchingUnit.organizationId,
              unitId: matchingUnit.id,
            },
            include: { organization: true, unit: true },
          })
        } else {
          user = await prisma.user.create({
            data: {
              phone: cleanPhone,
              name: name?.trim() || `Resident ${cleanPhone.slice(-4)}`,
              role: 'RESIDENT',
              status: 'ACTIVE',
              passwordHash: newHash,
              organizationId: null,
            },
            include: { organization: true, unit: true },
          })
        }
      }

      if (matched && user) {
        if (user.passwordHash) {
          const suppliedCurrent = typeof currentPin === 'string' ? currentPin.trim() : ''
          const suppliedOtp = otp ? String(otp).trim() : ''
          let proved = false
          if (suppliedCurrent) {
            proved = await verifyPassword(suppliedCurrent, user.passwordHash)
          }
          if (!proved && suppliedOtp) {
            proved = await verifyOTP(cleanPhone, suppliedOtp)
          }
          if (!proved) {
            return NextResponse.json(
              { error: 'Enter your current PIN, or the OTP sent to this mobile number, before setting a new PIN.' },
              { status: 403 }
            )
          }
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: newHash,
            name: name?.trim() ? name.trim() : user.name,
          },
          include: { organization: true, unit: true },
        })
      }

      // Create session
      const token = await createSession(user.id)
      const isConnected = Boolean(user.organizationId && user.unitId)

      const response = NextResponse.json({
        success: true,
        message: 'Security PIN set successfully! Entering portal...',
        token,
        isConnected,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name,
          unitId: user.unitId,
          unitNumber: user.unit?.unitNumber,
        },
      })

      response.cookies.set({
        name: 'rwa_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })

      return response
    }

    // ACTION 3: Regular PIN Login
    if (!secret) {
      return NextResponse.json(
        { error: 'Please enter your 4-to-6 digit Security PIN' },
        { status: 400 }
      )
    }

    // Find user by phone
    const matchedLogin = await findUserByPhone(cleanPhone)
    let user = matchedLogin
      ? await prisma.user.findUnique({
          where: { id: matchedLogin.id },
          include: {
            organization: true,
            unit: {
              include: {
                block: true,
              },
            },
          },
        })
      : null

    // If user not in User table, check if exists in Unit table
    if (!user) {
      const matchingUnit = await prisma.unit.findFirst({
        where: {
          OR: [
            { ownerPhone: cleanPhone },
            { ownerPhone: tenDigit },
            { tenantPhone: cleanPhone },
            { tenantPhone: tenDigit },
          ],
        },
        include: { organization: true, block: true },
      })

      if (matchingUnit) {
        // Mandatory PIN Setup for real data
        return NextResponse.json({
          error: 'First-time login: Please set up your 4-digit Security PIN first.',
          needsPinSetup: true,
          name: matchingUnit.ownerName || matchingUnit.tenantName || `Resident ${matchingUnit.unitNumber}`,
        }, { status: 403 })
      }

      // Check if phone belongs to society Staff & Guard Roster
      let matchingStaff = await prisma.staffDuty.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: tenDigit },
          ],
        },
        include: { organization: true },
      })

      const storedStaff = findInStaffStore(cleanPhone, tenDigit)
      if (matchingStaff || storedStaff) {
        return NextResponse.json({
          error: 'First-time login: Please set up your 4-digit Security PIN first.',
          needsPinSetup: true,
          name: matchingStaff?.staffName || storedStaff?.staff?.name || 'Staff',
        }, { status: 403 })
      }

      return NextResponse.json({
        error: 'No account found with this phone number. Please register your ID.',
        needsRegistration: true,
      }, { status: 404 })
    }

    if (!user) {
      return NextResponse.json({
        error: 'No account found with this phone number. Please register your ID.',
        needsRegistration: true,
      }, { status: 404 })
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Account has been suspended. Please contact RWA administration.' },
        { status: 403 }
      )
    }

    if (user.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Your membership is waiting for the society admin to approve it.' },
        { status: 403 }
      )
    }

    if (user.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'This membership application was declined. Contact the society office.' },
        { status: 403 }
      )
    }

    // Mandatory PIN check: If user does not have a PIN setup yet, require setup
    if (!user.passwordHash) {
      return NextResponse.json({
        error: 'First-time login: Please set up your 4-digit Security PIN first.',
        needsPinSetup: true,
        name: user.name,
      }, { status: 403 })
    }

    const isPinValid = await verifyPassword(secret, user.passwordHash)

    if (!isPinValid) {
      return NextResponse.json(
        { error: 'Incorrect Security PIN. Please check and try again, or reset your PIN.' },
        { status: 401 }
      )
    }

    let currentUnitId = user.unitId
    let currentOrgId = user.organizationId

    if (!currentUnitId || !currentOrgId) {
      const matchedUnit = await prisma.unit.findFirst({
        where: {
          OR: [
            { ownerPhone: cleanPhone },
            { ownerPhone: tenDigit },
            { tenantPhone: cleanPhone },
            { tenantPhone: tenDigit },
          ],
        },
      })

      if (matchedUnit) {
        currentOrgId = matchedUnit.organizationId
        currentUnitId = matchedUnit.id
        await prisma.user.update({
          where: { id: user.id },
          data: {
            organizationId: currentOrgId,
            unitId: currentUnitId,
          },
        })
      }
    }

    // Create session token
    const token = await createSession(user.id)

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organization: true,
        unit: {
          include: {
            block: true,
          },
        },
      },
    })

    let staffDutyInfo = null
    if (fullUser?.role === 'STAFF') {
      staffDutyInfo = await prisma.staffDuty.findFirst({
        where: {
          organizationId: fullUser.organizationId || undefined,
          OR: [
            { phone: cleanPhone },
            { phone: tenDigit },
          ],
        },
      })
    }

    const isConnected = Boolean(
      fullUser?.organizationId &&
      (fullUser?.role === 'STAFF' || fullUser?.unitId || fullUser?.role === 'ADMIN' || fullUser?.role === 'SUPER_ADMIN')
    )

    // Prepare response
    const response = NextResponse.json({
      success: true,
      token,
      isConnected,
      user: {
        id: fullUser?.id,
        name: fullUser?.name,
        phone: fullUser?.phone,
        email: fullUser?.email,
        role: fullUser?.role,
        organizationId: fullUser?.organizationId,
        organizationName: fullUser?.organization?.name,
        societyName: fullUser?.organization?.name,
        unitId: fullUser?.unitId,
        unitNumber: fullUser?.unit?.unitNumber,
        blockName: fullUser?.unit?.block?.name,
        post: staffDutyInfo?.locationPost || null,
        shift: staffDutyInfo?.shiftName || null,
        shiftTiming: staffDutyInfo ? `${staffDutyInfo.startTime} - ${staffDutyInfo.endTime}` : null,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set({
      name: 'rwa_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error: unknown) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    )
  }
}
