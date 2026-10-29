import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import fs from 'fs'
import path from 'path'

const SETTINGS_DATA_PATH = path.join(process.cwd(), 'settings_store.json')

export interface SocietyRulesSettings {
  lateFeeEnabled: boolean
  lateFeeType: 'FIXED' | 'PERCENTAGE'
  lateFeeAmount: number
  interestEnabled: boolean
  interestRateMonthly: number
  meetingNoticeDays: number
  committeeTermMonths: number
  quorumPercentage: number
  gracePeriodDays: number
}

export interface PaymentAccountSettings {
  bankName: string
  accountHolder: string
  accountNumber: string
  ifscCode: string
  branch: string
  upiId: string
  qrCodeEnabled: boolean
  razorpayKeyId: string
  autoReceipts: boolean
}

export interface NotificationSettings {
  smsBroadcastEnabled: boolean
  whatsappBroadcastEnabled: boolean
  emailAlertsEnabled: boolean
  overduePaymentReminders: boolean
  urgentNoticeSms: boolean
  visitorGateNotification: boolean
}

export interface SecuritySettings {
  twoFactorAuthEnabled: boolean
  sessionTimeoutMinutes: number
  strictPasswordPolicy: boolean
  ipWhitelistingEnabled: boolean
  auditLoggingStrict: boolean
}

export interface SocietyLocationSettings {
  googleMapsUrl?: string
  mapEmbedUrl?: string
  address?: string
  city?: string
  pincode?: string
  latitude?: number
  longitude?: number
  landmark?: string
  isConfigured?: boolean
}

export interface OrganizationSettingsPayload {
  rules: SocietyRulesSettings
  payment: PaymentAccountSettings
  notifications: NotificationSettings
  security: SecuritySettings
  location?: SocietyLocationSettings
}

function getDefaultSettings(): OrganizationSettingsPayload {
  return {
    rules: {
      lateFeeEnabled: false,
      lateFeeType: 'FIXED',
      lateFeeAmount: 100,
      interestEnabled: false,
      interestRateMonthly: 1.5,
      meetingNoticeDays: 14,
      committeeTermMonths: 12,
      quorumPercentage: 33,
      gracePeriodDays: 10,
    },
    payment: {
      bankName: 'HDFC Bank Ltd.',
      accountHolder: 'Greenwood Heights RWA',
      accountNumber: '50200088991122',
      ifscCode: 'HDFC0001234',
      branch: 'Sector 22 Branch, Chandigarh',
      upiId: 'test2.rwa@hdfcbank',
      qrCodeEnabled: true,
      razorpayKeyId: 'rzp_test_179118382',
      autoReceipts: true,
    },
    notifications: {
      smsBroadcastEnabled: true,
      whatsappBroadcastEnabled: true,
      emailAlertsEnabled: true,
      overduePaymentReminders: true,
      urgentNoticeSms: true,
      visitorGateNotification: true,
    },
    security: {
      twoFactorAuthEnabled: true,
      sessionTimeoutMinutes: 60,
      strictPasswordPolicy: true,
      ipWhitelistingEnabled: false,
      auditLoggingStrict: true,
    },
    location: {
      googleMapsUrl: '',
      mapEmbedUrl: '',
      address: '',
      city: 'Chandigarh',
      pincode: '',
      latitude: undefined,
      longitude: undefined,
      landmark: '',
      isConfigured: false,
    },
  }
}

function getStoredSettings(orgId: string): OrganizationSettingsPayload {
  try {
    if (fs.existsSync(SETTINGS_DATA_PATH)) {
      const allData = JSON.parse(fs.readFileSync(SETTINGS_DATA_PATH, 'utf-8'))
      if (allData && allData[orgId]) {
        return Object.assign(getDefaultSettings(), allData[orgId])
      }
    }
  } catch (e) {
    console.error('Error reading settings store:', e)
  }
  return getDefaultSettings()
}

function saveStoredSettings(orgId: string, settings: OrganizationSettingsPayload) {
  try {
    let allData: Record<string, OrganizationSettingsPayload> = {}
    if (fs.existsSync(SETTINGS_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(SETTINGS_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    allData[orgId] = settings
    fs.writeFileSync(SETTINGS_DATA_PATH, JSON.stringify(allData, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving settings store:', e)
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId!
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    })

    const storedSettings = getStoredSettings(orgId)
    // Synchronize account holder with current organization name if default
    if (organization && organization.name) {
      storedSettings.payment.accountHolder = organization.name
    }

    // Synchronize organization address into location settings
    if (organization && storedSettings.location) {
      if (!storedSettings.location.address && organization.address) {
        storedSettings.location.address = organization.address
      }
      if ((!storedSettings.location.city || storedSettings.location.city === 'Chandigarh') && organization.city) {
        storedSettings.location.city = organization.city
      }
      if (!storedSettings.location.pincode && organization.pincode) {
        storedSettings.location.pincode = organization.pincode
      }
      if (!storedSettings.location.mapEmbedUrl && (organization.address || organization.city)) {
        const query = [storedSettings.location.landmark, organization.address, organization.city, organization.pincode].filter(Boolean).join(', ')
        storedSettings.location.mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
        storedSettings.location.isConfigured = true
      }
    }

    return NextResponse.json({
      success: true,
      organization: organization || {
        id: orgId,
        name: 'Greenwood Heights RWA',
        registrationNo: 'CHD/RWA/2026/0042',
        address: 'Sector 22',
        city: 'Chandigarh',
        pincode: '160022',
        phone: user.phone || '98765 43210',
        email: user.email || 'admin@rwa.org',
      },
      settings: storedSettings,
    })
  } catch (err: unknown) {
    console.error('Settings GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId!
    const body = await request.json()
    const { section } = body

    const currentSettings = getStoredSettings(orgId)

    // 1. UPDATE ORGANIZATION PROFILE
    if (section === 'profile' || body.organization) {
      const orgData = body.organization || body
      const { name, registrationNo, address, city, pincode, phone, email } = orgData

      const updatedOrg = await prisma.organization.update({
        where: { id: orgId },
        data: {
          name: name ? name.trim() : undefined,
          registrationNo: registrationNo ? registrationNo.trim() : undefined,
          address: address ? address.trim() : undefined,
          city: city ? city.trim() : undefined,
          pincode: pincode ? pincode.trim() : undefined,
          phone: phone ? phone.trim() : undefined,
          email: email ? email.trim() : undefined,
        },
      })

      currentSettings.payment.accountHolder = updatedOrg.name
      if (address || city || pincode) {
        currentSettings.location = currentSettings.location || {
          googleMapsUrl: '',
          mapEmbedUrl: '',
          address: '',
          city: 'Chandigarh',
          pincode: '',
          isConfigured: false,
        }
        if (address) currentSettings.location.address = address.trim()
        if (city) currentSettings.location.city = city.trim()
        if (pincode) currentSettings.location.pincode = pincode.trim()
        currentSettings.location.isConfigured = true

        const q = [currentSettings.location.landmark, currentSettings.location.address, currentSettings.location.city, currentSettings.location.pincode].filter(Boolean).join(', ')
        currentSettings.location.mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      }
      saveStoredSettings(orgId, currentSettings)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'UPDATE_ORGANIZATION_PROFILE',
        entityType: 'ORGANIZATION',
        entityId: orgId,
        details: `Updated society profile: "${updatedOrg.name}" (${updatedOrg.registrationNo || 'No Reg No'})`,
        newValues: updatedOrg,
      })

      emitLiveSocketEvent('organization-updated', { organization: updatedOrg }, { orgId })

      return NextResponse.json({
        success: true,
        message: 'Organization profile updated successfully',
        organization: updatedOrg,
        settings: currentSettings,
      })
    }

    // 2. UPDATE RULES PROFILE
    if (section === 'rules') {
      const {
        lateFeeEnabled,
        lateFeeAmount,
        interestEnabled,
        interestRateMonthly,
        meetingNoticeDays,
        committeeTermMonths,
        quorumPercentage,
      } = body

      currentSettings.rules = {
        ...currentSettings.rules,
        lateFeeEnabled: lateFeeEnabled !== undefined ? Boolean(lateFeeEnabled) : currentSettings.rules.lateFeeEnabled,
        lateFeeAmount: lateFeeAmount !== undefined ? Number(lateFeeAmount) : currentSettings.rules.lateFeeAmount,
        interestEnabled: interestEnabled !== undefined ? Boolean(interestEnabled) : currentSettings.rules.interestEnabled,
        interestRateMonthly: interestRateMonthly !== undefined ? Number(interestRateMonthly) : currentSettings.rules.interestRateMonthly,
        meetingNoticeDays: meetingNoticeDays !== undefined ? Number(meetingNoticeDays) : currentSettings.rules.meetingNoticeDays,
        committeeTermMonths: committeeTermMonths !== undefined ? Number(committeeTermMonths) : currentSettings.rules.committeeTermMonths,
        quorumPercentage: quorumPercentage !== undefined ? Number(quorumPercentage) : currentSettings.rules.quorumPercentage,
      }

      saveStoredSettings(orgId, currentSettings)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'UPDATE_RULES_PROFILE',
        entityType: 'ORGANIZATION_SETTINGS',
        entityId: orgId,
        details: `Updated rules: Late Fee: ${currentSettings.rules.lateFeeEnabled ? 'ON' : 'OFF'}, Interest: ${currentSettings.rules.interestEnabled ? 'ON' : 'OFF'}, Quorum: ${currentSettings.rules.quorumPercentage}%`,
        newValues: currentSettings.rules,
      })

      return NextResponse.json({
        success: true,
        message: 'Society governance & fee rules updated',
        settings: currentSettings,
      })
    }

    // 3. UPDATE PAYMENT ACCOUNTS
    if (section === 'payment') {
      const { bankName, accountHolder, accountNumber, ifscCode, branch, upiId, qrCodeEnabled } = body
      currentSettings.payment = {
        ...currentSettings.payment,
        bankName: bankName !== undefined ? bankName.trim() : currentSettings.payment.bankName,
        accountHolder: accountHolder !== undefined ? accountHolder.trim() : currentSettings.payment.accountHolder,
        accountNumber: accountNumber !== undefined ? accountNumber.trim() : currentSettings.payment.accountNumber,
        ifscCode: ifscCode !== undefined ? ifscCode.trim().toUpperCase() : currentSettings.payment.ifscCode,
        branch: branch !== undefined ? branch.trim() : currentSettings.payment.branch,
        upiId: upiId !== undefined ? upiId.trim() : currentSettings.payment.upiId,
        qrCodeEnabled: qrCodeEnabled !== undefined ? Boolean(qrCodeEnabled) : currentSettings.payment.qrCodeEnabled,
      }

      saveStoredSettings(orgId, currentSettings)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'UPDATE_PAYMENT_ACCOUNT',
        entityType: 'ORGANIZATION_SETTINGS',
        entityId: orgId,
        details: `Updated society settlement account: ${currentSettings.payment.bankName} (${currentSettings.payment.accountNumber}) · UPI: ${currentSettings.payment.upiId}`,
        newValues: currentSettings.payment,
      })

      return NextResponse.json({
        success: true,
        message: 'Payment collection accounts updated',
        settings: currentSettings,
      })
    }

    // 4. UPDATE NOTIFICATION PREFERENCES
    if (section === 'notifications') {
      const {
        smsBroadcastEnabled,
        whatsappBroadcastEnabled,
        emailAlertsEnabled,
        overduePaymentReminders,
        urgentNoticeSms,
        visitorGateNotification,
      } = body

      currentSettings.notifications = {
        ...currentSettings.notifications,
        smsBroadcastEnabled: smsBroadcastEnabled !== undefined ? Boolean(smsBroadcastEnabled) : currentSettings.notifications.smsBroadcastEnabled,
        whatsappBroadcastEnabled: whatsappBroadcastEnabled !== undefined ? Boolean(whatsappBroadcastEnabled) : currentSettings.notifications.whatsappBroadcastEnabled,
        emailAlertsEnabled: emailAlertsEnabled !== undefined ? Boolean(emailAlertsEnabled) : currentSettings.notifications.emailAlertsEnabled,
        overduePaymentReminders: overduePaymentReminders !== undefined ? Boolean(overduePaymentReminders) : currentSettings.notifications.overduePaymentReminders,
        urgentNoticeSms: urgentNoticeSms !== undefined ? Boolean(urgentNoticeSms) : currentSettings.notifications.urgentNoticeSms,
        visitorGateNotification: visitorGateNotification !== undefined ? Boolean(visitorGateNotification) : currentSettings.notifications.visitorGateNotification,
      }

      saveStoredSettings(orgId, currentSettings)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'UPDATE_NOTIFICATION_SETTINGS',
        entityType: 'ORGANIZATION_SETTINGS',
        entityId: orgId,
        details: 'Updated notification gateway and dispatch preferences',
        newValues: currentSettings.notifications,
      })

      return NextResponse.json({
        success: true,
        message: 'Notification preferences updated',
        settings: currentSettings,
      })
    }

    // 5. UPDATE SECURITY SETTINGS
    if (section === 'security') {
      const { twoFactorAuthEnabled, sessionTimeoutMinutes, strictPasswordPolicy, ipWhitelistingEnabled } = body
      currentSettings.security = {
        ...currentSettings.security,
        twoFactorAuthEnabled: twoFactorAuthEnabled !== undefined ? Boolean(twoFactorAuthEnabled) : currentSettings.security.twoFactorAuthEnabled,
        sessionTimeoutMinutes: sessionTimeoutMinutes !== undefined ? Number(sessionTimeoutMinutes) : currentSettings.security.sessionTimeoutMinutes,
        strictPasswordPolicy: strictPasswordPolicy !== undefined ? Boolean(strictPasswordPolicy) : currentSettings.security.strictPasswordPolicy,
        ipWhitelistingEnabled: ipWhitelistingEnabled !== undefined ? Boolean(ipWhitelistingEnabled) : currentSettings.security.ipWhitelistingEnabled,
      }

      saveStoredSettings(orgId, currentSettings)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'UPDATE_SECURITY_SETTINGS',
        entityType: 'ORGANIZATION_SETTINGS',
        entityId: orgId,
        details: `Updated security policies: 2FA: ${currentSettings.security.twoFactorAuthEnabled ? 'ON' : 'OFF'}, Session Timeout: ${currentSettings.security.sessionTimeoutMinutes}m`,
        newValues: currentSettings.security,
      })

      return NextResponse.json({
        success: true,
        message: 'Security settings updated',
        settings: currentSettings,
      })
    }

    // 6. UPDATE SOCIETY GOOGLE MAPS LOCATION
    if (section === 'location' || body.location) {
      const loc = body.location || body
      const { googleMapsUrl, address, city, pincode, latitude, longitude, landmark } = loc

      const updatedLoc: SocietyLocationSettings = {
        googleMapsUrl: googleMapsUrl ? String(googleMapsUrl).trim() : (currentSettings.location?.googleMapsUrl || ''),
        mapEmbedUrl: '',
        address: address ? String(address).trim() : (currentSettings.location?.address || ''),
        city: city ? String(city).trim() : (currentSettings.location?.city || 'Chandigarh'),
        pincode: pincode ? String(pincode).trim() : (currentSettings.location?.pincode || ''),
        latitude: latitude ? Number(latitude) : currentSettings.location?.latitude,
        longitude: longitude ? Number(longitude) : currentSettings.location?.longitude,
        landmark: landmark ? String(landmark).trim() : (currentSettings.location?.landmark || ''),
        isConfigured: true,
      }

      // Generate clean Google Maps embed URL - prioritize address added by RWA admin!
      let query = ''
      const addressParts = [updatedLoc.landmark, updatedLoc.address, updatedLoc.city, updatedLoc.pincode].filter(Boolean)
      const addressQuery = addressParts.join(', ').trim()
      const isHttp = updatedLoc.googleMapsUrl && updatedLoc.googleMapsUrl.startsWith('http')
      const isCoords = updatedLoc.googleMapsUrl && /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(updatedLoc.googleMapsUrl)

      if (addressQuery) {
        query = addressQuery
      } else if (updatedLoc.googleMapsUrl && !isHttp && !isCoords) {
        query = updatedLoc.googleMapsUrl
      } else if (updatedLoc.latitude && updatedLoc.longitude) {
        query = `${updatedLoc.latitude},${updatedLoc.longitude}`
      } else if (updatedLoc.googleMapsUrl && !isHttp) {
        query = updatedLoc.googleMapsUrl
      } else {
        const orgRec = await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } })
        query = orgRec?.name || 'Chandigarh, India'
      }

      updatedLoc.mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

      currentSettings.location = updatedLoc
      saveStoredSettings(orgId, currentSettings)

      // Also sync address into organization record if provided
      if (address || city || pincode) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            address: address ? String(address).trim() : undefined,
            city: city ? String(city).trim() : undefined,
            pincode: pincode ? String(pincode).trim() : undefined,
          },
        }).catch(() => null)
      }

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'UPDATE_SOCIETY_LOCATION',
        entityType: 'ORGANIZATION_SETTINGS',
        entityId: orgId,
        details: `Updated Google Maps location: "${query}"`,
        newValues: updatedLoc,
      })

      emitLiveSocketEvent('society-location-updated', { location: updatedLoc }, { orgId })

      return NextResponse.json({
        success: true,
        message: 'Society Google Maps location updated successfully!',
        location: updatedLoc,
        settings: currentSettings,
      })
    }

    return NextResponse.json({ error: 'Unrecognized settings section' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Settings POST error:', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

