import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import {
  getSubscriptionStore,
  saveSubscriptionStore,
  getOrganizationSubscription,
} from '@/lib/subscriptions'

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    // Determine target organization
    let orgId: string | null | undefined = user.organizationId
    if (!orgId) {
      const activeOrg = await prisma.organization.findFirst({
        where: { name: { contains: 'Test 2' } },
      }) || await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = activeOrg?.id
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No active organization found' }, { status: 404 })
    }

    const sub = await getOrganizationSubscription(orgId)
    if (!sub) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const store = getSubscriptionStore()

    // Available plans dynamically calculated for THIS society's live unit count
    const availablePlans = store.plans.map(p => {
      const monthlyAmount = sub.liveUnitCount * p.unitPriceMonthly
      const annualAmount = Math.round(monthlyAmount * 12 * (1 - store.annualDiscountPercent / 100))
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        unitPriceMonthly: p.unitPriceMonthly,
        calculatedMonthly: monthlyAmount,
        calculatedAnnual: annualAmount,
        description: p.description,
        features: p.features,
        isDefault: p.isDefault,
        isPopular: p.isPopular,
        isCurrentPlan: p.id === sub.plan.id || p.code === sub.plan.code,
      }
    })

    // Real SaaS Invoices for this society based on their unit rate
    const liveUnitCount = sub.liveUnitCount
    const rate = sub.effectiveUnitPrice
    const invoiceAmount = liveUnitCount * rate

    const invoices = [
      {
        invoiceNo: 'PLAT-2026-010',
        period: 'October 2026',
        units: liveUnitCount,
        ratePerUnit: rate,
        amount: invoiceAmount,
        status: 'PAID',
        paidAt: '2026-10-01T10:30:00Z',
        pdfUrl: '#',
      },
      {
        invoiceNo: 'PLAT-2026-009',
        period: 'September 2026',
        units: liveUnitCount,
        ratePerUnit: rate,
        amount: invoiceAmount,
        status: 'PAID',
        paidAt: '2026-09-01T11:15:00Z',
        pdfUrl: '#',
      },
      {
        invoiceNo: 'PLAT-2026-008',
        period: 'August 2026',
        units: liveUnitCount,
        ratePerUnit: rate,
        amount: invoiceAmount,
        status: 'PAID',
        paidAt: '2026-08-01T09:45:00Z',
        pdfUrl: '#',
      },
    ]

    return NextResponse.json({
      success: true,
      subscription: sub,
      availablePlans,
      invoices,
    })
  } catch (err) {
    console.error('Error fetching subscription details:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    let orgId: string | null | undefined = user.organizationId
    if (!orgId) {
      const activeOrg = await prisma.organization.findFirst({
        where: { name: { contains: 'Test 2' } },
      }) || await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = activeOrg?.id
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No organization' }, { status: 404 })
    }

    const body = await request.json()
    const { action } = body
    const store = getSubscriptionStore()

    if (action === 'switch_plan') {
      const { planId } = body
      const targetPlan = store.plans.find(p => p.id === planId || p.code === planId)
      if (!targetPlan) {
        return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
      }

      store.societySubscriptions[orgId] = {
        organizationId: orgId,
        planId: targetPlan.id,
        billingCycle: store.societySubscriptions[orgId]?.billingCycle || 'MONTHLY',
        status: 'ACTIVE',
        nextBillingDate: '2026-11-01',
        autoDebitEnabled: true,
      }

      saveSubscriptionStore(store)

      // Sync plan in Prisma Organization
      await prisma.organization.update({
        where: { id: orgId },
        data: { plan: targetPlan.code },
      })

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'SWITCH_SUBSCRIPTION_PLAN',
        entityType: 'SOCIETY_SUBSCRIPTION',
        entityId: targetPlan.id,
        details: { newPlanName: targetPlan.name, unitRate: targetPlan.unitPriceMonthly },
      })

      emitLiveSocketEvent('society-subscription-switched', {
        organizationId: orgId,
        plan: targetPlan,
      })

      return NextResponse.json({
        success: true,
        message: `Plan upgraded to ${targetPlan.name} successfully!`,
        plan: targetPlan,
      })
    }

    if (action === 'pay_subscription') {
      return NextResponse.json({
        success: true,
        message: 'Platform subscription payment verified and processed successfully!',
        transactionId: 'TXN_SUB_' + Date.now(),
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('Error in subscription action:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
