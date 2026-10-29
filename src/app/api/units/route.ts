import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get('blockId') || undefined
    const status = searchParams.get('status') || undefined

    let orgId = searchParams.get('orgId') || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || null
    }

    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

    const [units, blocks] = await Promise.all([
      prisma.unit.findMany({
        where: {
          organizationId: orgId,
          ...(blockId ? { blockId } : {}),
          ...(status ? { occupancyStatus: status } : {}),
        },
        include: {
          block: true,
          users: {
            select: { id: true, name: true, phone: true, role: true, email: true },
          },
          invoices: {
            select: {
              id: true,
              invoiceNumber: true,
              billingMonth: true,
              dueDate: true,
              status: true,
              totalAmount: true,
              paidAmount: true,
              balanceAmount: true,
              lateFee: true,
            },
            orderBy: { billingMonth: 'desc' },
          },
        },
        orderBy: [{ blockId: 'asc' }, { unitNumber: 'asc' }],
      }),
      prisma.block.findMany({
        where: { organizationId: orgId },
        orderBy: { name: 'asc' },
      }),
    ])

    return NextResponse.json({ units, blocks })
  } catch (err: unknown) {
    console.error('Error fetching units:', err)
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      unitNumber,
      blockId,
      unitType,
      floor,
      areaSqft,
      occupancyStatus,
      ownerName,
      ownerPhone,
      ownerEmail,
      tenantName,
      tenantPhone,
    } = body

    if (!unitNumber) {
      return NextResponse.json({ error: 'Unit number is required' }, { status: 400 })
    }

    let orgId = body.organizationId || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || null
    }

    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

    const existing = await prisma.unit.findUnique({
      where: {
        organizationId_unitNumber: {
          organizationId: orgId,
          unitNumber: unitNumber.trim(),
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: `Unit ${unitNumber} already exists in this society` }, { status: 409 })
    }

    const unit = await prisma.unit.create({
      data: {
        organizationId: orgId,
        unitNumber: unitNumber.trim(),
        blockId: blockId || null,
        unitType: unitType || 'FLAT_2BHK',
        floor: floor ? parseInt(floor, 10) : 1,
        areaSqft: areaSqft ? parseFloat(areaSqft) : null,
        occupancyStatus: occupancyStatus || 'OWNER_OCCUPIED',
        ownerName: ownerName?.trim() || null,
        ownerPhone: ownerPhone?.trim() || null,
        ownerEmail: ownerEmail?.trim() || null,
        tenantName: tenantName?.trim() || null,
        tenantPhone: tenantPhone?.trim() || null,
      },
      include: {
        block: true,
        users: { select: { id: true, name: true, phone: true, role: true } },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            billingMonth: true,
            dueDate: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, unit })
  } catch (err: unknown) {
    console.error('Error creating unit:', err)
    return NextResponse.json({ error: 'Failed to create unit' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      id,
      unitNumber,
      blockId,
      floor,
      areaSqft,
      unitType,
      occupancyStatus,
      ownerName,
      ownerPhone,
      ownerEmail,
      tenantName,
      tenantPhone,
      notes,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (unitNumber !== undefined) updateData.unitNumber = unitNumber ? unitNumber.trim() : undefined
    if (blockId !== undefined) updateData.blockId = blockId || null
    if (floor !== undefined) updateData.floor = floor !== '' && floor !== null ? parseInt(floor, 10) : null
    if (areaSqft !== undefined) updateData.areaSqft = areaSqft !== '' && areaSqft !== null ? parseFloat(areaSqft) : null
    if (unitType !== undefined) updateData.unitType = unitType
    if (occupancyStatus !== undefined) updateData.occupancyStatus = occupancyStatus
    if (ownerName !== undefined) updateData.ownerName = ownerName ? ownerName.trim() : null
    if (ownerPhone !== undefined) updateData.ownerPhone = ownerPhone ? ownerPhone.trim().replace(/\s+/g, '') : null
    if (ownerEmail !== undefined) updateData.ownerEmail = ownerEmail ? ownerEmail.trim() : null
    if (tenantName !== undefined) updateData.tenantName = tenantName ? tenantName.trim() : null
    if (tenantPhone !== undefined) updateData.tenantPhone = tenantPhone ? tenantPhone.trim().replace(/\s+/g, '') : null
    if (notes !== undefined) updateData.notes = notes

    const updated = await prisma.unit.update({
      where: { id },
      data: updateData,
      include: {
        block: true,
        users: { select: { id: true, name: true, phone: true, role: true, email: true } },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            billingMonth: true,
            dueDate: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            lateFee: true,
          },
          orderBy: { billingMonth: 'desc' },
        },
      },
    })

    // If ownerPhone was supplied, update or create user record
    if (updateData.ownerPhone) {
      try {
        await prisma.user.upsert({
          where: { phone: updateData.ownerPhone },
          update: {
            organizationId: updated.organizationId,
            unitId: updated.id,
            name: updateData.ownerName || undefined,
            email: updateData.ownerEmail || undefined,
          },
          create: {
            organizationId: updated.organizationId,
            unitId: updated.id,
            name: updateData.ownerName || `Owner Flat ${updated.unitNumber}`,
            phone: updateData.ownerPhone,
            email: updateData.ownerEmail || null,
            role: 'RESIDENT',
            status: 'ACTIVE',
          },
        })
      } catch (errUser) {
        console.warn('Sync user record for owner skipped:', errUser)
      }
    }

    if (updateData.tenantPhone && updateData.tenantPhone !== updateData.ownerPhone) {
      try {
        await prisma.user.upsert({
          where: { phone: updateData.tenantPhone },
          update: {
            organizationId: updated.organizationId,
            unitId: updated.id,
            name: updateData.tenantName || undefined,
          },
          create: {
            organizationId: updated.organizationId,
            unitId: updated.id,
            name: updateData.tenantName || `Tenant Flat ${updated.unitNumber}`,
            phone: updateData.tenantPhone,
            role: 'RESIDENT',
            status: 'ACTIVE',
          },
        })
      } catch (errTenant) {
        console.warn('Sync user record for tenant skipped:', errTenant)
      }
    }

    if ((updateData.ownerName && updateData.ownerPhone) || (updateData.tenantName && updateData.tenantPhone)) {
      try {
        const isTenant = !!updateData.tenantName
        const resName = updateData.tenantName || updateData.ownerName
        const resPhone = updateData.tenantPhone || updateData.ownerPhone
        const blockName = updated.block?.name || 'Main Block'

        const admins = await prisma.user.findMany({
          where: {
            OR: [
              { organizationId: updated.organizationId, role: { in: ['RWA_ADMIN', 'ADMIN', 'MANAGER', 'SECRETARY', 'TREASURER', 'PLATFORM_ADMIN', 'PRESIDENT'] } },
              { organizationId: updated.organizationId, role: { not: 'RESIDENT' } },
              { role: { in: ['RWA_ADMIN', 'PLATFORM_ADMIN'] } },
              { phone: '8219587657' },
            ],
          },
          select: { id: true },
        })

        const uniqueAdminIds = Array.from(new Set(admins.map(a => a.id)))
        const notifTitle = '👤 Resident Assigned to Unit ' + updated.unitNumber
        const notifMessage = `Resident ${resName} (+91 ${resPhone}) was assigned to Unit ${updated.unitNumber} (${blockName}) as ${isTenant ? 'Tenant' : 'Flat Owner'}.`

        for (const aId of uniqueAdminIds) {
          await prisma.notification.create({
            data: {
              organizationId: updated.organizationId,
              userId: aId,
              title: notifTitle,
              message: notifMessage,
              type: 'RESIDENT_ONBOARDED',
              referenceType: 'UNIT',
              referenceId: updated.id,
            },
          }).catch(() => {})
        }

        const socketPayload = {
          residentName: resName,
          phone: resPhone,
          unitNumber: updated.unitNumber,
          blockName,
          occupancyType: isTenant ? 'TENANT' : 'OWNER',
          orgId: updated.organizationId,
          timestamp: new Date().toISOString(),
        }
        emitLiveSocketEvent('resident-onboarded', socketPayload, { orgId: updated.organizationId })
        emitLiveSocketEvent('resident-onboarded', socketPayload)
      } catch (e) {
        console.warn('Unit update notification error:', e)
      }
    }

    return NextResponse.json({ success: true, unit: updated })
  } catch (err: unknown) {
    console.error('Error updating unit:', err)
    return NextResponse.json({ error: 'Failed to update unit: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}
