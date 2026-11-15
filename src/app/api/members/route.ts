import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { findUserByPhone, normalizePhone, emailUsedBySomeoneElse } from '@/lib/phone'

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const orgId = user.organizationId

    if (!orgId) {
      return NextResponse.json({ members: [] })
    }

    // 1. Fetch all registered users in this organization
    const members = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        role: role ? role : { notIn: ['STAFF'] },
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { phone: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        unit: {
          include: {
            block: true,
            vehicles: {
              select: { id: true, type: true, registrationNo: true, make: true, model: true, color: true, parkingSlot: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 2. Discover any flat owners/tenants from Unit records who don't have User login accounts yet
    // Automatically auto-provision them so they appear in Members directory AND can log in via OTP!
    const existingPhones = new Set(members.map(m => m.phone))
    const newlyCreatedMembers: any[] = []

    const unitsWithContacts = await prisma.unit.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { ownerPhone: { not: null } },
          { tenantPhone: { not: null } },
        ],
      },
      include: { block: true },
    })

    for (const unit of unitsWithContacts) {
      // Auto-provision Owner
      if (unit.ownerPhone && !existingPhones.has(unit.ownerPhone)) {
        try {
          const cleanPhone = normalizePhone(unit.ownerPhone)
          if (!cleanPhone || existingPhones.has(cleanPhone)) continue
          const already = await findUserByPhone(cleanPhone)
          if (already) {
            existingPhones.add(cleanPhone)
            continue
          }
          const ownerUser = await prisma.user.upsert({
            where: { phone: cleanPhone },
            update: {
              organizationId: orgId,
              unitId: unit.id,
              name: unit.ownerName?.trim() || `Owner Flat ${unit.unitNumber}`,
              email: unit.ownerEmail?.trim() || undefined,
            },
            create: {
              organizationId: orgId,
              unitId: unit.id,
              name: unit.ownerName?.trim() || `Owner Flat ${unit.unitNumber}`,
              phone: cleanPhone,
              email: unit.ownerEmail?.trim() || null,
              role: 'RESIDENT',
              status: 'ACTIVE',
            },
            include: {
              unit: {
                include: { block: true, vehicles: { select: { id: true, type: true, registrationNo: true, make: true, model: true, color: true, parkingSlot: true } } },
              },
            },
          })
          existingPhones.add(cleanPhone)
          newlyCreatedMembers.push(ownerUser)
        } catch (e) {
          console.warn('Auto-provision owner skipped:', unit.ownerPhone, e)
        }
      }

      // Auto-provision Tenant (if distinct phone)
      if (unit.tenantPhone && unit.tenantPhone !== unit.ownerPhone && !existingPhones.has(unit.tenantPhone)) {
        try {
          const cleanPhone = normalizePhone(unit.tenantPhone)
          if (!cleanPhone || existingPhones.has(cleanPhone)) continue
          const already = await findUserByPhone(cleanPhone)
          if (already) {
            existingPhones.add(cleanPhone)
            continue
          }
          const tenantUser = await prisma.user.upsert({
            where: { phone: cleanPhone },
            update: {
              organizationId: orgId,
              unitId: unit.id,
              name: unit.tenantName?.trim() || `Tenant Flat ${unit.unitNumber}`,
            },
            create: {
              organizationId: orgId,
              unitId: unit.id,
              name: unit.tenantName?.trim() || `Tenant Flat ${unit.unitNumber}`,
              phone: cleanPhone,
              role: 'RESIDENT',
              status: 'ACTIVE',
            },
            include: {
              unit: {
                include: { block: true, vehicles: { select: { id: true, type: true, registrationNo: true, make: true, model: true, color: true, parkingSlot: true } } },
              },
            },
          })
          existingPhones.add(cleanPhone)
          newlyCreatedMembers.push(tenantUser)
        } catch (e) {
          console.warn('Auto-provision tenant skipped:', unit.tenantPhone, e)
        }
      }
    }

    const allMembers = [...members, ...newlyCreatedMembers]

    const safeMembers = allMembers.map((member) => {
      const safe = { ...member }
      delete (safe as { passwordHash?: string }).passwordHash
      return safe
    })
    return NextResponse.json({ members: safeMembers })
  } catch (err: unknown) {
    console.error('Error fetching members:', err)
    return NextResponse.json({ error: 'Failed to fetch members: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, phone, email, role, unitId, unitNumber, occupancyType, password, pin } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    const cleanPhone = normalizePhone(phone)
    if (!cleanPhone) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 })
    }

    const orgId = user.organizationId

    if (!orgId) {
      return NextResponse.json({ error: 'No organization attached to this request' }, { status: 400 })
    }

    // Resolve unitId if unitNumber is provided
    let resolvedUnitId = unitId || null
    if (!resolvedUnitId && unitNumber) {
      const unit = await prisma.unit.findFirst({
        where: { organizationId: orgId, unitNumber: unitNumber.trim() },
      })
      if (unit) resolvedUnitId = unit.id
    }

    // Check if phone exists
    const existing = await findUserByPhone(cleanPhone)
    if (await emailUsedBySomeoneElse(email, existing?.id)) {
      return NextResponse.json(
        { error: 'This email is already registered to another account. One phone number can have only one account.' },
        { status: 409 }
      )
    }

    const blockedRoles = ['PLATFORM_ADMIN', 'PLATFORM_SUPER_ADMIN']
    const officeRoles = ['RWA_ADMIN', 'TREASURER', 'COMMITTEE_MEMBER']
    const allowedRoles = ['RESIDENT', 'STAFF', 'COMMITTEE_MEMBER', 'TREASURER', 'RWA_ADMIN']
    const requestedRole = String(role || 'RESIDENT').trim()
    if (!allowedRoles.includes(requestedRole) || blockedRoles.includes(requestedRole)) {
      return NextResponse.json({ error: 'That role cannot be assigned from this screen' }, { status: 400 })
    }
    if (officeRoles.includes(requestedRole) && !['RWA_ADMIN', 'PLATFORM_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Only the society admin can assign an office role' }, { status: 403 })
    }

    if (existing?.organizationId && existing.organizationId !== orgId) {
      return NextResponse.json(
        { error: 'This mobile number already belongs to another society' },
        { status: 409 }
      )
    }

    if (resolvedUnitId) {
      const unitInSociety = await prisma.unit.findFirst({
        where: { id: resolvedUnitId, organizationId: orgId },
      })
      if (!unitInSociety) {
        return NextResponse.json({ error: 'That flat is not in this society' }, { status: 400 })
      }
      resolvedUnitId = unitInSociety.id
    }

    const rawPin = (pin || password || '').trim()
    const passwordHash = !existing && rawPin ? await bcrypt.hash(rawPin, 10) : null
    let member

    if (existing) {
      member = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          email: email?.trim() || existing.email,
          role: requestedRole,
          unitId: resolvedUnitId || existing.unitId,
          organizationId: existing.organizationId || orgId,
          status: 'ACTIVE',
        },
        include: {
          unit: {
            include: { block: true },
          },
        },
      })
    } else {
      member = await prisma.user.create({
        data: {
          organizationId: orgId,
          name: name.trim(),
          phone: cleanPhone,
          email: email?.trim() || null,
          role: requestedRole,
          unitId: resolvedUnitId,
          passwordHash,
          status: 'ACTIVE',
        },
        include: {
          unit: {
            include: { block: true },
          },
        },
      })
    }

    // If unit is linked, update unit owner/tenant details as well
    if (resolvedUnitId) {
      const isTenant = occupancyType === 'Tenant' || role === 'TENANT'
      await prisma.unit.update({
        where: { id: resolvedUnitId },
        data: isTenant
          ? {
              tenantName: name.trim(),
              tenantPhone: cleanPhone,
              occupancyStatus: 'TENANTED',
            }
          : {
              ownerName: name.trim(),
              ownerPhone: cleanPhone,
              ownerEmail: email?.trim() || undefined,
              occupancyStatus: 'OWNER_OCCUPIED',
            },
      })
    }

    // Notify admins about newly added resident
    try {
      const admins = await prisma.user.findMany({
        where: {
          organizationId: orgId,
          role: { in: ['RWA_ADMIN', 'ADMIN', 'MANAGER', 'SECRETARY', 'TREASURER', 'PRESIDENT', 'COMMITTEE_MEMBER'] },
        },
        select: { id: true },
      })

      const uniqueAdminIds = Array.from(new Set(admins.map(a => a.id)))
      const unitNumStr = member.unit?.unitNumber || unitNumber || 'Unassigned Flat'
      const blockStr = member.unit?.block?.name ? ` (${member.unit.block.name})` : ''
      const notifTitle = '👤 New Resident Added to Society'
      const notifMessage = `Resident ${name.trim()} (+91 ${cleanPhone}) was added to Unit ${unitNumStr}${blockStr}.`

      for (const aId of uniqueAdminIds) {
        await prisma.notification.create({
          data: {
            organizationId: orgId,
            userId: aId,
            title: notifTitle,
            message: notifMessage,
            type: 'RESIDENT_ONBOARDED',
            referenceType: member.unitId ? 'UNIT' : 'USER',
            referenceId: member.unitId || member.id,
          },
        }).catch(() => {})
      }

      const socketPayload = {
        residentName: name.trim(),
        phone: cleanPhone,
        unitNumber: unitNumStr,
        blockName: member.unit?.block?.name || '',
        occupancyType: occupancyType || 'OWNER',
        orgId,
        timestamp: new Date().toISOString(),
      }
      emitLiveSocketEvent('resident-onboarded', socketPayload, { orgId, roles: ['admin'] })
    } catch (notifErr) {
      console.warn('Notification creation error in members POST:', notifErr)
    }

    return NextResponse.json({ success: true, member })
  } catch (err: unknown) {
    console.error('Error creating member:', err)
    return NextResponse.json({ error: 'Failed to create member: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}
