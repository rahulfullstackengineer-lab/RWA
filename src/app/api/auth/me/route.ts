import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { normalizePhone } from '@/lib/phone'

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request)

  if (error || !user) {
    return NextResponse.json({ error: error || 'Not authenticated' }, { status: 401 })
  }

  const userUnit = user.unit as any
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      organizationId: user.organizationId,
      organization: user.organization,
      unitId: user.unitId,
      unit: user.unit,
      unitNumber: userUnit?.unitNumber || null,
      blockName: userUnit?.block?.name || null,
    },
  })
}

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return NextResponse.json({ error: error || 'Not authenticated' }, { status: 401 })
  }

  try {
    const { hashPassword } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    const body = await request.json()
    const { name, email, password, unitId } = body

    const updateData: any = {}
    if (name && typeof name === 'string') updateData.name = name.trim()
    if (email !== undefined) updateData.email = email ? email.trim() : null
    if (password && typeof password === 'string' && password.length >= 6) {
      updateData.passwordHash = await hashPassword(password)
    }
    if (unitId) {
      const { prisma: unitPrisma } = await import('@/lib/prisma')
      const unit = await unitPrisma.unit.findFirst({ where: { id: unitId } })
      if (!unit) {
        return NextResponse.json({ error: 'That flat was not found' }, { status: 404 })
      }
      if (user.organizationId && unit.organizationId !== user.organizationId) {
        return NextResponse.json({ error: 'That flat is not in your society' }, { status: 403 })
      }
      const phone = normalizePhone(user.phone)
      const listed = phone && (normalizePhone(unit.ownerPhone) === phone || normalizePhone(unit.tenantPhone) === phone)
      if (!listed) {
        return NextResponse.json(
          { error: 'You can only link a flat that already lists your mobile number. Ask the society admin to add you.' },
          { status: 403 }
        )
      }
      updateData.unitId = unit.id
      if (!user.organizationId) updateData.organizationId = unit.organizationId
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: {
        organization: true,
        unit: {
          include: {
            block: true,
          },
        },
      },
    })

    const updatedUserUnit = updatedUser.unit as any
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role,
        organizationId: updatedUser.organizationId,
        organization: updatedUser.organization,
        unitId: updatedUser.unitId,
        unit: updatedUser.unit,
        unitNumber: updatedUserUnit?.unitNumber || null,
        blockName: updatedUserUnit?.block?.name || null,
      },
    })
  } catch (err: any) {
    console.error('Update profile error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 })
  }
}

