import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePlatformAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { user, error } = await requirePlatformAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }

    // Aggregate real recent events from database
    const recentOrgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const recentInvoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        organization: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        organization: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const auditEvents = [
      ...recentOrgs.map(o => ({
        id: `org_${o.id}`,
        timestamp: o.createdAt,
        type: 'SOCIETY_ONBOARDED',
        category: 'GOVERNANCE',
        society: o.name,
        details: `New society onboarded in ${o.city} with automatic tenant isolation`,
        status: 'SUCCESS',
      })),
      ...recentInvoices.map(i => ({
        id: `inv_${i.id}`,
        timestamp: i.createdAt,
        type: 'INVOICE_GENERATED',
        category: 'BILLING',
        society: i.organization?.name || 'Platform',
        details: `Bill ${i.invoiceNumber} generated for ₹${i.totalAmount.toLocaleString('en-IN')} (${i.status})`,
        status: 'SUCCESS',
      })),
      ...recentUsers.map(u => ({
        id: `user_${u.id}`,
        timestamp: u.createdAt,
        type: 'USER_REGISTERED',
        category: 'AUTH',
        society: u.organization?.name || 'Platform Central',
        details: `${u.name} registered with role ${u.role}`,
        status: 'SUCCESS',
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      success: true,
      totalEvents: auditEvents.length,
      events: auditEvents,
    })
  } catch (err) {
    console.error('Platform audit API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
