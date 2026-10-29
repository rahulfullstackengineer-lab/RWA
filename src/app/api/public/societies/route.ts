import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    // If orgId is provided, return property structure (blocks & units) for that society
    if (orgId) {
      const society = await prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          totalUnits: true,
        },
      })

      if (!society) {
        return NextResponse.json({ error: 'Society not found' }, { status: 404 })
      }

      const [blocks, units] = await Promise.all([
        prisma.block.findMany({
          where: { organizationId: orgId },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            floors: true,
          },
        }),
        prisma.unit.findMany({
          where: { organizationId: orgId },
          orderBy: { unitNumber: 'asc' },
          select: {
            id: true,
            unitNumber: true,
            blockId: true,
            unitType: true,
            floor: true,
            areaSqft: true,
            occupancyStatus: true,
            ownerName: true,
            ownerPhone: true,
            tenantName: true,
            tenantPhone: true,
          },
        }),
      ])

      const mappedUnits = units.map(u => ({
        id: u.id,
        unitNumber: u.unitNumber,
        blockId: u.blockId,
        unitType: u.unitType,
        floor: u.floor,
        areaSqft: u.areaSqft,
        occupancyStatus: u.occupancyStatus,
        hasOwner: Boolean(u.ownerName || u.ownerPhone),
        hasTenant: Boolean(u.tenantName || u.tenantPhone),
      }))

      return NextResponse.json({
        success: true,
        society,
        blocks,
        units: mappedUnits,
      })
    }

    // Default: Return all active registered societies
    const societies = await prisma.organization.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        totalUnits: true,
        logoUrl: true,
        _count: {
          select: {
            units: true,
            users: true,
          },
        },
      },
    })

    const formatted = societies.map(s => ({
      id: s.id,
      name: s.name,
      city: s.city || 'Chandigarh',
      address: s.address || '',
      totalUnits: s.totalUnits || s._count.units,
      residentCount: s._count.users,
    }))

    return NextResponse.json({
      success: true,
      societies: formatted,
    })
  } catch (err: unknown) {
    console.error('Error fetching public societies:', err)
    return NextResponse.json({ error: 'Failed to fetch societies' }, { status: 500 })
  }
}
