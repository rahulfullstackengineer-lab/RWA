import fs from 'fs'
import path from 'path'
import { prisma } from './prisma'
import { logAudit } from './audit'

const STORE_PATH = path.join(process.cwd(), 'platform_subscriptions_store.json')

export interface UnitPlan {
  id: string
  code: string // 'STARTER', 'GROWTH', 'PRO'
  name: string
  unitPriceMonthly: number // per unit per month (default 50 for growth)
  description: string
  features: string[]
  isDefault: boolean
  isPopular?: boolean
  status: 'ACTIVE' | 'ARCHIVED'
}

export interface SocietySubscriptionOverride {
  organizationId: string
  planId: string
  customUnitPrice?: number | null // Super admin custom rate override
  billingCycle: 'MONTHLY' | 'ANNUAL'
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED'
  nextBillingDate: string
  autoDebitEnabled: boolean
  notes?: string
}

export interface PlatformSubscriptionStore {
  defaultUnitPrice: number // 50
  annualDiscountPercent: number // 10
  plans: UnitPlan[]
  societySubscriptions: Record<string, SocietySubscriptionOverride>
}

export function getDefaultSubscriptionStore(): PlatformSubscriptionStore {
  return {
    defaultUnitPrice: 50,
    annualDiscountPercent: 10,
    plans: [
      {
        id: 'plan_starter',
        code: 'STARTER',
        name: 'Starter Unit Plan',
        unitPriceMonthly: 35,
        description: 'Essential society operations, directory, and complaint management',
        features: [
          'Unit & Resident Directory Registry',
          'Basic Maintenance Billing & Receipts',
          'Resident Helpdesk & Complaint Tracking',
          'Digital Notice Board & Circulars',
          'Document Vault & By-Laws Repository',
        ],
        isDefault: false,
        status: 'ACTIVE',
      },
      {
        id: 'plan_growth',
        code: 'GROWTH',
        name: 'Growth Standard Plan',
        unitPriceMonthly: 50, // Default 50 rs per unit per month
        description: 'Complete financial automation, online UPI gateway, and statutory compliance',
        features: [
          'All Starter Features included',
          'Razorpay & Instant UPI Collection Gateway',
          'Double-Entry Accounting & Vendor Ledgers',
          'Statutory Compliance Calendar with Google Sync',
          'Amenity & Facility Reservations Engine',
          'Automated PDF Bills with Email & SMS Alerts',
          'Visitor Passcodes & Staff Attendance Register',
        ],
        isDefault: true,
        isPopular: true,
        status: 'ACTIVE',
      },
      {
        id: 'plan_pro',
        code: 'PRO',
        name: 'Pro Enterprise Plan',
        unitPriceMonthly: 75,
        description: 'High-scale community automation, digital democracy, and priority SLA',
        features: [
          'All Growth Standard Features included',
          'Official WhatsApp Business API Broadcasts',
          'Digital Secret Ballot Elections & AGM Quorum Polls',
          'Vehicle RFID Barrier & Parking Slot Allocation',
          'Multi-Block Multi-Tier Financial Audits',
          'Custom Society Subdomain & Dedicated Account Manager',
          '99.9% Uptime Guarantee & Priority Phone SLA',
        ],
        isDefault: false,
        status: 'ACTIVE',
      },
    ],
    societySubscriptions: {},
  }
}

export function getSubscriptionStore(): PlatformSubscriptionStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      return {
        ...getDefaultSubscriptionStore(),
        ...parsed,
        plans: Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed.plans : getDefaultSubscriptionStore().plans,
        societySubscriptions: parsed.societySubscriptions || {},
      }
    }
  } catch (err) {
    console.error('Error reading platform_subscriptions_store.json:', err)
  }

  const def = getDefaultSubscriptionStore()
  saveSubscriptionStore(def)
  return def
}

export function saveSubscriptionStore(store: PlatformSubscriptionStore) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8')
  } catch (err) {
    console.error('Error writing platform_subscriptions_store.json:', err)
  }
}

/**
 * Get effective unit price and plan for an organization
 */
export async function getOrganizationSubscription(orgId: string) {
  const store = getSubscriptionStore()
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: {
        select: { units: true, users: true },
      },
    },
  })

  if (!org) return null

  const liveUnitCount = org._count.units > 0 ? org._count.units : (org.totalUnits > 0 ? org.totalUnits : 1)
  const override = store.societySubscriptions[orgId]

  // Find plan
  let plan = store.plans.find(p => p.id === override?.planId || p.code === org.plan)
  if (!plan) {
    plan = store.plans.find(p => p.isDefault) || store.plans[0]
  }

  const effectiveUnitPrice = (override && typeof override.customUnitPrice === 'number' && override.customUnitPrice > 0)
    ? override.customUnitPrice
    : plan.unitPriceMonthly

  const billingCycle = override?.billingCycle || 'MONTHLY'
  const status = override?.status || 'ACTIVE'
  const monthlyTotal = liveUnitCount * effectiveUnitPrice
  const annualTotal = Math.round(monthlyTotal * 12 * (1 - (store.annualDiscountPercent / 100)))

  return {
    organization: {
      id: org.id,
      name: org.name,
      registrationNo: org.registrationNo,
      city: org.city,
      address: org.address,
      phone: org.phone,
      email: org.email,
      totalUnits: liveUnitCount,
    },
    plan,
    override,
    effectiveUnitPrice,
    liveUnitCount,
    billingCycle,
    status,
    monthlyTotal,
    annualTotal,
    nextBillingDate: override?.nextBillingDate || '2026-11-01',
    autoDebitEnabled: override?.autoDebitEnabled ?? true,
  }
}
