import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// Temporary route. Delete this file after the database has been emptied.

const CONFIRM = 'EMPTY DATABASE'

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This temporary route is disabled in production.' }, { status: 403 })
  }

  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return NextResponse.json({ error: 'Sign in first, then call this route.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  if (body?.confirm !== CONFIRM) {
    return NextResponse.json({ error: `Send { "confirm": "${CONFIRM}" } to empty the database.` }, { status: 400 })
  }

  const steps: Array<[string, () => Promise<{ count: number }>]> = [
    ['otpCodes', () => prisma.otpCode.deleteMany()],
    ['sessions', () => prisma.session.deleteMany()],
    ['notifications', () => prisma.notification.deleteMany()],
    ['complaintComments', () => prisma.complaintComment.deleteMany()],
    ['complaints', () => prisma.complaint.deleteMany()],
    ['payments', () => prisma.payment.deleteMany()],
    ['invoiceItems', () => prisma.invoiceItem.deleteMany()],
    ['invoices', () => prisma.invoice.deleteMany()],
    ['documents', () => prisma.document.deleteMany()],
    ['amenityBookings', () => prisma.amenityBooking.deleteMany()],
    ['amenities', () => prisma.amenity.deleteMany()],
    ['entryPasses', () => prisma.entryPass.deleteMany()],
    ['staffDuties', () => prisma.staffDuty.deleteMany()],
    ['emergencyContacts', () => prisma.emergencyContact.deleteMany()],
    ['auditLogs', () => prisma.auditLog.deleteMany()],
    ['expenses', () => prisma.expense.deleteMany()],
    ['notices', () => prisma.notice.deleteMany()],
    ['meetings', () => prisma.meeting.deleteMany()],
    ['vehicles', () => prisma.vehicle.deleteMany()],
    ['chargeHeads', () => prisma.chargeHead.deleteMany()],
    ['fundHeads', () => prisma.fundHead.deleteMany()],
    ['units', () => prisma.unit.deleteMany()],
    ['blocks', () => prisma.block.deleteMany()],
    ['users', () => prisma.user.deleteMany()],
    ['organizations', () => prisma.organization.deleteMany()],
  ]

  const deleted: Record<string, number> = {}
  try {
    for (const [name, run] of steps) {
      const result = await run()
      deleted[name] = result.count
    }
  } catch (err) {
    console.error('Database wipe failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Database wipe failed', deleted },
      { status: 500 }
    )
  }

  const users = await prisma.user.count()
  const organizations = await prisma.organization.count()
  return NextResponse.json({
    success: true,
    message: 'Database emptied. Sign-in accounts were removed, so sign out and create a society again.',
    deleted,
    remaining: { users, organizations },
  })
}
