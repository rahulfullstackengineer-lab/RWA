import { prisma } from '@/lib/prisma'

export async function residentIdsForPass(
  orgId: string,
  pass: { residentUnit?: string | null; unitId?: string | null; residentPhone?: string | null }
) {
  const flat = String(pass.residentUnit || '').replace(/^flat\s*/i, '').trim().toLowerCase()
  const phone = String(pass.residentPhone || '').replace(/\D/g, '').slice(-10)
  const people = await prisma.user.findMany({
    where: {
      organizationId: orgId,
      role: 'RESIDENT',
      status: { not: 'REJECTED' },
    },
    select: {
      id: true,
      phone: true,
      unitId: true,
      unit: { select: { unitNumber: true } },
    },
  })

  return people.filter((person) => {
    if (pass.unitId && person.unitId === pass.unitId) return true
    const unitNo = String(person.unit?.unitNumber || '').trim().toLowerCase()
    if (flat && unitNo && (unitNo === flat || unitNo.endsWith(flat) || flat.endsWith(unitNo))) return true
    const personPhone = String(person.phone || '').replace(/\D/g, '').slice(-10)
    if (phone && personPhone && phone === personPhone) return true
    return false
  }).map((person) => person.id)
}
