import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePlatformAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { user, error } = await requirePlatformAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        unit: {
          select: {
            unitNumber: true,
            block: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email || 'N/A',
        role: u.role,
        status: u.status,
        societyId: u.organization?.id || null,
        societyName: u.organization?.name || (u.role === 'PLATFORM_ADMIN' ? 'Platform Central' : 'Unassigned'),
        city: u.organization?.city || 'Tricity',
        unit: u.unit ? `${u.unit.block?.name || ''} ${u.unit.unitNumber}`.trim() : 'N/A',
        createdAt: u.createdAt,
      })),
    })
  } catch (err) {
    console.error('Platform users API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
