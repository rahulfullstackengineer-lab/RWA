import { prisma } from '@/lib/prisma'

type InvoiceRow = {
  id: string
  unitId: string
  status: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paidAt: Date | null
  dueDate: Date
}

function money(n: number) {
  return Math.round(n * 100) / 100
}

// A lump-sum receipt used to land entirely on the oldest bill. Any amount
// above that bill is moved onto the flat's later open bills.
export async function spreadOverpaidInvoices(organizationId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { organizationId },
    orderBy: [{ unitId: 'asc' }, { dueDate: 'asc' }],
  })

  const byUnit = new Map<string, InvoiceRow[]>()
  for (const inv of invoices) {
    const list = byUnit.get(inv.unitId) || []
    list.push(inv)
    byUnit.set(inv.unitId, list)
  }

  for (const list of byUnit.values()) {
    const hasSurplus = list.some((inv) => (inv.paidAmount || 0) > (inv.totalAmount || 0) + 0.5)
    const hasOpen = list.some((inv) => (inv.balanceAmount || 0) > 0.5 && (inv.paidAmount || 0) + 0.5 < (inv.totalAmount || 0))
    if (!hasSurplus || !hasOpen) continue

    let left = list.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0)
    for (let i = 0; i < list.length; i++) {
      const inv = list[i]
      const cap = inv.totalAmount || 0
      const isLast = i === list.length - 1
      const paid = money(isLast ? left : Math.min(left, cap))
      left = money(left - paid)
      const balance = money(Math.max(0, cap - paid))
      const status = balance <= 0.5 ? 'PAID' : paid > 0 ? (inv.status === 'OVERDUE' ? 'OVERDUE' : 'PARTIALLY_PAID') : inv.status
      const samePaid = Math.abs(paid - (inv.paidAmount || 0)) < 0.5
      const sameBal = Math.abs(balance - (inv.balanceAmount || 0)) < 0.5
      const sameStatus = status === inv.status
      if (samePaid && sameBal && sameStatus) continue
      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          paidAmount: paid,
          balanceAmount: balance,
          status,
          paidAt: balance <= 0.5 ? (inv.paidAt || new Date()) : inv.paidAt,
        },
      })
    }
  }
}

export function invoiceOwing(inv: { balanceAmount?: number | null; totalAmount?: number | null; paidAmount?: number | null }) {
  if ((inv.balanceAmount || 0) > 0.5) return inv.balanceAmount || 0
  return Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0))
}
