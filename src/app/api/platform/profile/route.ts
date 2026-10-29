import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePlatformAdmin, hashPassword } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { user, error } = await requirePlatformAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }

    const superAdmin = await prisma.user.findFirst({
      where: { phone: '8219587657' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const totalSocieties = await prisma.organization.count()
    const totalUnits = await prisma.unit.count()
    const totalUsers = await prisma.user.count()

    return NextResponse.json({
      success: true,
      user: superAdmin,
      system: {
        role: 'PLATFORM_SUPER_ADMIN',
        accessScope: 'Full Root Access across all Tenant Societies',
        totalSocieties,
        totalUnits,
        totalUsers,
        dbStatus: 'CONNECTED (Prisma Engine)',
        authType: 'Two-Factor Mobile OTP & Encrypted Session',
        nodeEnv: process.env.NODE_ENV || 'development',
      },
    })
  } catch (err) {
    console.error('Super Admin profile GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { user, error } = await requirePlatformAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password } = body

    const updateData: { name?: string; email?: string; passwordHash?: string } = {}
    if (name && typeof name === 'string') updateData.name = name.trim()
    if (email && typeof email === 'string') updateData.email = email.trim()
    if (password && typeof password === 'string' && password.length >= 6) {
      updateData.passwordHash = await hashPassword(password)
    }

    const updatedUser = await prisma.user.update({
      where: { phone: '8219587657' },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Super Admin profile updated successfully',
      user: updatedUser,
    })
  } catch (err) {
    console.error('Super Admin profile PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
