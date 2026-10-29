import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePlatformAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import {
  getSubscriptionStore,
  saveSubscriptionStore,
  UnitPlan,
} from '@/lib/subscriptions'

export async function GET(request: Request) {
  try {
    const { user, error } = await requirePlatformAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }

    const store = getSubscriptionStore()
    const societies = await prisma.organization.findMany({
      include: {
        _count: {
          select: { units: true, users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let platformMRR = 0
    let totalPlatformUnits = 0

    const societyList = societies.map(s => {
      const liveUnits = s._count.units > 0 ? s._count.units : (s.totalUnits > 0 ? s.totalUnits : 1)
      totalPlatformUnits += liveUnits

      const override = store.societySubscriptions[s.id]
      let plan = store.plans.find(p => p.id === override?.planId || p.code === s.plan)
      if (!plan) {
        plan = store.plans.find(p => p.isDefault) || store.plans[0]
      }

      const hasCustomRate = override && typeof override.customUnitPrice === 'number' && override.customUnitPrice > 0
      const effectiveUnitPrice = hasCustomRate ? override.customUnitPrice! : plan.unitPriceMonthly
      const billingCycle = override?.billingCycle || 'MONTHLY'
      const status = override?.status || 'ACTIVE'
      const monthlyTotal = liveUnits * effectiveUnitPrice

      if (status === 'ACTIVE') {
        platformMRR += monthlyTotal
      }

      return {
        id: s.id,
        name: s.name,
        registrationNo: s.registrationNo,
        city: s.city,
        unitsCount: liveUnits,
        membersCount: s._count.users,
        planId: plan.id,
        planCode: plan.code,
        planName: plan.name,
        effectiveUnitPrice,
        hasCustomRate,
        billingCycle,
        status,
        monthlyTotal,
        annualTotal: Math.round(monthlyTotal * 12 * (1 - store.annualDiscountPercent / 100)),
        nextBillingDate: override?.nextBillingDate || '2026-11-01',
        createdAt: s.createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      defaultUnitPrice: store.defaultUnitPrice,
      annualDiscountPercent: store.annualDiscountPercent,
      plans: store.plans,
      societies: societyList,
      metrics: {
        totalSocieties: societies.length,
        totalUnits: totalPlatformUnits,
        platformMRR,
        activeSubscriptionsCount: societyList.filter(s => s.status === 'ACTIVE').length,
        avgRatePerUnit: totalPlatformUnits > 0 ? Math.round(platformMRR / totalPlatformUnits) : store.defaultUnitPrice,
      },
    })
  } catch (err) {
    console.error('Error fetching platform subscriptions:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requirePlatformAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body
    const store = getSubscriptionStore()

    // 1. Update Global Default Unit Price (e.g. ₹50 / unit / month)
    if (action === 'update_default_rate') {
      const newRate = Number(body.defaultUnitPrice)
      if (isNaN(newRate) || newRate <= 0) {
        return NextResponse.json({ error: 'Valid per-unit rate is required' }, { status: 400 })
      }

      store.defaultUnitPrice = newRate
      // Also update default plan rate
      const defaultPlan = store.plans.find(p => p.isDefault)
      if (defaultPlan) {
        defaultPlan.unitPriceMonthly = newRate
      }

      saveSubscriptionStore(store)

      await logAudit({
        organizationId: user.organizationId || 'PLATFORM',
        userId: user.id,
        action: 'UPDATE_PLATFORM_UNIT_RATE',
        entityType: 'PLATFORM_PRICING',
        entityId: 'GLOBAL',
        details: { newDefaultUnitPrice: newRate },
      })

      emitLiveSocketEvent('platform-pricing-updated', { defaultUnitPrice: newRate })

      return NextResponse.json({
        success: true,
        message: `Default platform rate updated to ₹${newRate}/unit/month`,
        defaultUnitPrice: newRate,
        plans: store.plans,
      })
    }

    // 2. Update Existing Plan Tier
    if (action === 'update_plan') {
      const { planId, name, unitPriceMonthly, description, features, isDefault } = body
      const planIdx = store.plans.findIndex(p => p.id === planId)
      if (planIdx === -1) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      }

      const rate = Number(unitPriceMonthly)
      if (isNaN(rate) || rate <= 0) {
        return NextResponse.json({ error: 'Valid per-unit rate is required' }, { status: 400 })
      }

      if (isDefault) {
        store.plans.forEach(p => (p.isDefault = false))
        store.defaultUnitPrice = rate
      }

      store.plans[planIdx] = {
        ...store.plans[planIdx],
        name: name || store.plans[planIdx].name,
        unitPriceMonthly: rate,
        description: description ?? store.plans[planIdx].description,
        features: Array.isArray(features) ? features : store.plans[planIdx].features,
        isDefault: Boolean(isDefault),
      }

      saveSubscriptionStore(store)

      await logAudit({
        organizationId: user.organizationId || 'PLATFORM',
        userId: user.id,
        action: 'UPDATE_SUBSCRIPTION_PLAN',
        entityType: 'UNIT_PLAN',
        entityId: planId,
        details: { planName: name, unitPriceMonthly: rate },
      })

      emitLiveSocketEvent('platform-pricing-updated', { plans: store.plans })

      return NextResponse.json({
        success: true,
        message: `Plan ${store.plans[planIdx].name} updated successfully`,
        plan: store.plans[planIdx],
        plans: store.plans,
      })
    }

    // 3. Create New Plan
    if (action === 'create_plan') {
      const { name, code, unitPriceMonthly, description, features, isDefault } = body
      if (!name || !unitPriceMonthly) {
        return NextResponse.json({ error: 'Plan name and unit price are required' }, { status: 400 })
      }

      const rate = Number(unitPriceMonthly)
      const newPlanId = 'plan_' + (code ? code.toLowerCase() : Date.now())

      if (isDefault) {
        store.plans.forEach(p => (p.isDefault = false))
        store.defaultUnitPrice = rate
      }

      const newPlan: UnitPlan = {
        id: newPlanId,
        code: (code || name.toUpperCase().replace(/\s+/g, '_')).substring(0, 15),
        name,
        unitPriceMonthly: rate,
        description: description || 'Custom society unit tier',
        features: Array.isArray(features) && features.length > 0 ? features : ['Basic society features'],
        isDefault: Boolean(isDefault),
        status: 'ACTIVE',
      }

      store.plans.push(newPlan)
      saveSubscriptionStore(store)

      await logAudit({
        organizationId: user.organizationId || 'PLATFORM',
        userId: user.id,
        action: 'CREATE_SUBSCRIPTION_PLAN',
        entityType: 'UNIT_PLAN',
        entityId: newPlan.id,
        details: newPlan,
      })

      emitLiveSocketEvent('platform-pricing-updated', { plans: store.plans })

      return NextResponse.json({
        success: true,
        message: `New plan ${newPlan.name} created!`,
        plan: newPlan,
        plans: store.plans,
      })
    }

    // 4. Update Individual Society Subscription & Override
    if (action === 'update_society_sub') {
      const { organizationId, planId, customUnitPrice, billingCycle, status, nextBillingDate, notes } = body
      if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
      }

      const org = await prisma.organization.findUnique({ where: { id: organizationId } })
      if (!org) {
        return NextResponse.json({ error: 'Society not found' }, { status: 404 })
      }

      let targetPlan = store.plans.find(p => p.id === planId)
      if (!targetPlan) {
        targetPlan = store.plans.find(p => p.isDefault) || store.plans[0]
      }

      const customRate = (customUnitPrice !== undefined && customUnitPrice !== null && customUnitPrice !== '')
        ? Number(customUnitPrice)
        : null

      store.societySubscriptions[organizationId] = {
        organizationId,
        planId: targetPlan.id,
        customUnitPrice: (customRate && customRate > 0) ? customRate : null,
        billingCycle: billingCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY',
        status: ['ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELLED'].includes(status) ? status : 'ACTIVE',
        nextBillingDate: nextBillingDate || '2026-11-01',
        autoDebitEnabled: true,
        notes: notes || '',
      }

      saveSubscriptionStore(store)

      // Also sync plan code into Prisma Organization
      await prisma.organization.update({
        where: { id: organizationId },
        data: { plan: targetPlan.code },
      })

      await logAudit({
        organizationId,
        userId: user.id,
        action: 'UPDATE_SOCIETY_SUBSCRIPTION',
        entityType: 'SOCIETY_SUBSCRIPTION',
        entityId: organizationId,
        details: {
          societyName: org.name,
          plan: targetPlan.name,
          customUnitPrice: customRate,
          status,
        },
      })

      emitLiveSocketEvent('society-subscription-updated', {
        organizationId,
        plan: targetPlan,
        status,
      })

      return NextResponse.json({
        success: true,
        message: `Subscription for ${org.name} updated successfully!`,
        subscription: store.societySubscriptions[organizationId],
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('Error modifying platform subscriptions:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
