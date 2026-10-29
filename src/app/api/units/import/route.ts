import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { emitLiveSocketEvent } from '@/lib/socket-server'

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }

    let orgId = user.organizationId
    if (!orgId) {
      const url = new URL(request.url)
      orgId = url.searchParams.get('orgId') || request.headers.get('x-active-org-id')
      if (!orgId) {
        const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
        orgId = firstOrg?.id || null
      }
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization found' }, { status: 400 })
    }

    const body = await request.json()
    const { units = [], updateExisting = true, createAccounts = true } = body

    if (!Array.isArray(units) || units.length === 0) {
      return NextResponse.json({ error: 'No units provided in import payload' }, { status: 400 })
    }

    // Pre-fetch existing blocks for this society
    const existingBlocks = await prisma.block.findMany({
      where: { organizationId: orgId },
    })
    const blockMap = new Map<string, string>()
    for (const b of existingBlocks) {
      blockMap.set(b.name.toLowerCase().trim(), b.id)
    }

    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    let accountsCreated = 0

    for (const row of units) {
      const unitNumber = String(row.unitNumber || '').trim()
      if (!unitNumber) {
        skippedCount++
        continue
      }

      // 1. Resolve or Create Block / Tower
      let blockId: string | null = null
      const rawBlockName = String(row.blockName || row.block || 'Main Block').trim()
      if (rawBlockName) {
        const lowerName = rawBlockName.toLowerCase()
        if (blockMap.has(lowerName)) {
          blockId = blockMap.get(lowerName)!
        } else {
          // Create new block
          const newBlock = await prisma.block.create({
            data: {
              organizationId: orgId,
              name: rawBlockName,
            },
          })
          blockId = newBlock.id
          blockMap.set(lowerName, blockId)
        }
      }

      // Normalize Occupancy Status
      let occupancyStatus = 'OWNER_OCCUPIED'
      const rawOcc = String(row.occupancyStatus || row.status || '').toUpperCase()
      if (rawOcc.includes('TENANT')) occupancyStatus = 'TENANTED'
      else if (rawOcc.includes('VACANT')) occupancyStatus = 'VACANT'
      else if (rawOcc.includes('CONST')) occupancyStatus = 'UNDER_CONSTRUCTION'

      // Normalize Unit Type
      let unitType = 'FLAT_2BHK'
      const rawType = String(row.unitType || row.type || '').toUpperCase()
      if (rawType.includes('3BHK') || rawType.includes('3 BHK')) unitType = 'FLAT_3BHK'
      else if (rawType.includes('4BHK') || rawType.includes('4 BHK')) unitType = 'FLAT_4BHK'
      else if (rawType.includes('1BHK') || rawType.includes('1 BHK')) unitType = 'FLAT_1BHK'
      else if (rawType.includes('VILLA')) unitType = 'VILLA'
      else if (rawType.includes('PLOT')) unitType = 'PLOT'
      else if (rawType.includes('SHOP') || rawType.includes('COMMERCIAL')) unitType = 'SHOP'

      const floor = row.floor ? parseInt(String(row.floor), 10) : 1
      const areaSqft = row.areaSqft || row.area ? parseFloat(String(row.areaSqft || row.area).replace(/[^0-9.]/g, '')) : 1200
      const ownerName = row.ownerName ? String(row.ownerName).trim() : null
      const ownerPhone = row.ownerPhone ? String(row.ownerPhone).trim().replace(/[^0-9]/g, '') : null
      const ownerEmail = row.ownerEmail ? String(row.ownerEmail).trim() : null
      const tenantName = row.tenantName ? String(row.tenantName).trim() : null
      const tenantPhone = row.tenantPhone ? String(row.tenantPhone).trim().replace(/[^0-9]/g, '') : null

      // Check if unit exists
      const existing = await prisma.unit.findUnique({
        where: {
          organizationId_unitNumber: {
            organizationId: orgId,
            unitNumber,
          },
        },
      })

      let targetUnitId = ''

      if (existing) {
        if (!updateExisting) {
          skippedCount++
          continue
        }

        const updated = await prisma.unit.update({
          where: { id: existing.id },
          data: {
            ...(blockId ? { blockId } : {}),
            floor,
            unitType,
            areaSqft,
            occupancyStatus,
            ownerName: ownerName !== null ? ownerName : existing.ownerName,
            ownerPhone: ownerPhone !== null ? ownerPhone : existing.ownerPhone,
            ownerEmail: ownerEmail !== null ? ownerEmail : existing.ownerEmail,
            tenantName: tenantName !== null ? tenantName : existing.tenantName,
            tenantPhone: tenantPhone !== null ? tenantPhone : existing.tenantPhone,
          },
        })
        targetUnitId = updated.id
        updatedCount++
      } else {
        const created = await prisma.unit.create({
          data: {
            organizationId: orgId,
            unitNumber,
            blockId,
            floor,
            unitType,
            areaSqft,
            occupancyStatus,
            ownerName,
            ownerPhone,
            ownerEmail,
            tenantName,
            tenantPhone,
          },
        })
        targetUnitId = created.id
        createdCount++
      }

      // 2. Auto-Provision Resident Accounts for OTP Login if createAccounts is true
      if (createAccounts && targetUnitId) {
        // Owner Account
        if (ownerPhone && ownerPhone.length >= 10) {
          const cleanPhone = ownerPhone.slice(-10)
          const existingUser = await prisma.user.findFirst({
            where: { phone: cleanPhone },
          })

          if (!existingUser) {
            await prisma.user.create({
              data: {
                phone: cleanPhone,
                name: ownerName || `Resident ${unitNumber}`,
                email: ownerEmail || null,
                role: 'RESIDENT',
                status: 'ACTIVE',
                organizationId: orgId,
                unitId: targetUnitId,
              },
            })
            accountsCreated++
          } else if (!existingUser.unitId || !existingUser.organizationId) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                organizationId: orgId,
                unitId: targetUnitId,
                role: existingUser.role === 'PLATFORM_ADMIN' ? existingUser.role : 'RESIDENT',
              },
            })
          }
        }

        // Tenant Account
        if (tenantPhone && tenantPhone.length >= 10 && tenantPhone !== ownerPhone) {
          const cleanTenantPhone = tenantPhone.slice(-10)
          const existingTenant = await prisma.user.findFirst({
            where: { phone: cleanTenantPhone },
          })

          if (!existingTenant) {
            await prisma.user.create({
              data: {
                phone: cleanTenantPhone,
                name: tenantName || `Tenant ${unitNumber}`,
                role: 'RESIDENT',
                status: 'ACTIVE',
                organizationId: orgId,
                unitId: targetUnitId,
              },
            })
            accountsCreated++
          }
        }
      }
    }

    // Update total units count on society organization
    const totalUnitsCount = await prisma.unit.count({
      where: { organizationId: orgId },
    })
    await prisma.organization.update({
      where: { id: orgId },
      data: { totalUnits: totalUnitsCount },
    })

    // Log Immutable Audit Event
    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'UNITS_ROSTER_IMPORTED',
      entityType: 'UnitRegistry',
      entityId: `${units.length} Units`,
      details: `Imported society roster from spreadsheet: ${createdCount} created, ${updatedCount} updated, ${accountsCreated} resident accounts provisioned. Total units: ${totalUnitsCount}`,
      severity: 'INFO',
      newValues: {
        totalImported: units.length,
        createdCount,
        updatedCount,
        skippedCount,
        accountsCreated,
        totalUnitsCount,
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    // Broadcast live event to all connected admin and resident clients
    emitLiveSocketEvent('units-roster-updated', {
      organizationId: orgId,
      totalUnits: totalUnitsCount,
      createdCount,
      updatedCount,
      accountsCreated,
      timestamp: new Date().toISOString(),
    }, { orgId })

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${units.length} units: ${createdCount} new flats added, ${updatedCount} updated, ${accountsCreated} resident login accounts prepared.`,
      createdCount,
      updatedCount,
      skippedCount,
      accountsCreated,
      totalUnitsCount,
    })
  } catch (err: unknown) {
    console.error('Error importing units:', err)
    return NextResponse.json({ error: 'Failed to import units roster' }, { status: 500 })
  }
}
