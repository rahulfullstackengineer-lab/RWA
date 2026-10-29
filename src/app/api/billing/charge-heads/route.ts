import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    let orgId = searchParams.get('orgId') || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || null
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization selected' }, { status: 400 })
    }

    const [chargeHeads, fundHeads, org] = await Promise.all([
      prisma.chargeHead.findMany({
        where: { organizationId: orgId },
        include: { fundHead: true },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      }),
      prisma.fundHead.findMany({
        where: { organizationId: orgId },
        orderBy: { name: 'asc' },
      }),
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, totalUnits: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      chargeHeads,
      fundHeads,
      society: org,
    })
  } catch (err: unknown) {
    console.error('Error fetching charge heads:', err)
    return NextResponse.json({ error: 'Failed to fetch charge heads' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, fundHeadId, frequency, basis, amount, gstPercent, description, isActive } = body

    if (!name || amount === undefined) {
      return NextResponse.json({ error: 'Name and amount are required' }, { status: 400 })
    }

    let orgId = body.organizationId || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || null
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization selected' }, { status: 400 })
    }

    const chargeHead = await prisma.chargeHead.create({
      data: {
        organizationId: orgId,
        name: name.trim(),
        fundHeadId: fundHeadId || null,
        frequency: frequency || 'MONTHLY',
        basis: basis || 'FIXED',
        amount: parseFloat(amount) || 0,
        gstPercent: gstPercent !== undefined ? parseFloat(gstPercent) : 0,
        description: description?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        fundHead: true,
      },
    })

    return NextResponse.json({ success: true, chargeHead })
  } catch (err: unknown) {
    console.error('Error creating charge head:', err)
    return NextResponse.json({ error: 'Failed to create charge head' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, name, fundHeadId, frequency, basis, amount, gstPercent, description, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Charge Head ID is required' }, { status: 400 })
    }

    const existing = await prisma.chargeHead.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Charge Head not found' }, { status: 404 })
    }

    const updated = await prisma.chargeHead.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        fundHeadId: fundHeadId !== undefined ? (fundHeadId || null) : existing.fundHeadId,
        frequency: frequency || existing.frequency,
        basis: basis || existing.basis,
        amount: amount !== undefined ? parseFloat(amount) : existing.amount,
        gstPercent: gstPercent !== undefined ? parseFloat(gstPercent) : existing.gstPercent,
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
      include: {
        fundHead: true,
      },
    })

    return NextResponse.json({ success: true, chargeHead: updated })
  } catch (err: unknown) {
    console.error('Error updating charge head:', err)
    return NextResponse.json({ error: 'Failed to update charge head' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Charge Head ID is required' }, { status: 400 })
    }

    const existing = await prisma.chargeHead.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Charge Head not found' }, { status: 404 })
    }

    await prisma.chargeHead.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: `Charge head "${existing.name}" removed successfully` })
  } catch (err: unknown) {
    console.error('Error deleting charge head:', err)
    return NextResponse.json({ error: 'Failed to delete charge head' }, { status: 500 })
  }
}
