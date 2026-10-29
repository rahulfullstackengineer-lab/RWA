import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOTP, verifyOTP, createSession } from '@/lib/auth'

// Send OTP
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, action, channel = 'whatsapp' } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '')

    // Check user exists
    let user = await prisma.user.findFirst({
      where: { phone: cleanPhone },
    })

    // If user does not exist in User table yet, check if phone number exists in Unit registry (as Owner or Tenant)
    if (!user) {
      const tenDigit = cleanPhone.slice(-10)
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
        const isTenant = matchingUnit.tenantPhone === cleanPhone || matchingUnit.tenantPhone === tenDigit
        const resName = isTenant
          ? (matchingUnit.tenantName || `Resident ${matchingUnit.unitNumber}`)
          : (matchingUnit.ownerName || `Resident ${matchingUnit.unitNumber}`)

        user = await prisma.user.create({
          data: {
            phone: cleanPhone,
            name: resName,
            role: 'RESIDENT',
            status: 'ACTIVE',
            organizationId: matchingUnit.organizationId,
            unitId: matchingUnit.id,
          },
        })
      } else {
        // Create an unattached resident record so new residents can log in and onboard into a society
        user = await prisma.user.create({
          data: {
            phone: cleanPhone,
            name: `Resident ${cleanPhone.slice(-4)}`,
            role: 'RESIDENT',
            status: 'ACTIVE',
            organizationId: null,
            unitId: null,
          },
        })
      }
    }

    if (action === 'send') {
      const code = await createOTP(user.id, cleanPhone)
      const tenDigit = cleanPhone.slice(-10)

      console.log(`\n💬 [WhatsApp Gateway] OTP sent to +91 ${cleanPhone}: ${code} (expires in 10 mins)\n`)

      // Check for external Twilio WhatsApp gateway credentials
      let dispatchedViaExternal = false
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
        try {
          const twilioAuth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
          const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${twilioAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
              To: `whatsapp:+91${tenDigit}`,
              Body: `Your Storeify RWA verification code is: ${code}. Valid for 10 minutes. Do not share this OTP with anyone.`,
            }),
          })
          if (twilioRes.ok) dispatchedViaExternal = true
        } catch (err) {
          console.warn('[WhatsApp Twilio Dispatch Error]', err)
        }
      }

      const waLink = `https://wa.me/91${tenDigit}?text=${encodeURIComponent(`Your Storeify RWA verification code is: ${code}\n\nValid for 10 minutes. Do not share this code.`)}`

      return NextResponse.json({
        success: true,
        channel: 'whatsapp',
        message: `OTP sent via WhatsApp to +91 ${cleanPhone}`,
        waLink,
        dispatchedViaExternal,
        devCode: process.env.NODE_ENV !== 'production' ? code : undefined,
      })
    }

    if (action === 'verify') {
      const { code } = body
      if (!code) {
        return NextResponse.json({ error: 'OTP code is required' }, { status: 400 })
      }

      // Allow 123456 as universal test OTP in development
      const isTestCode = process.env.NODE_ENV !== 'production' && code === '123456'
      const isValid = isTestCode || (await verifyOTP(cleanPhone, code))

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
      }

      // Check if user has connected unit or if a matching unit was added recently
      let currentUnitId = user.unitId
      let currentOrgId = user.organizationId

      if (!currentUnitId || !currentOrgId) {
        const tenDigit = cleanPhone.slice(-10)
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

      // Create session
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

      const isConnected = Boolean(fullUser?.organizationId && fullUser?.unitId)

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
          unitId: fullUser?.unitId,
          unitNumber: fullUser?.unit?.unitNumber,
          blockName: fullUser?.unit?.block?.name,
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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: unknown) {
    console.error('OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
