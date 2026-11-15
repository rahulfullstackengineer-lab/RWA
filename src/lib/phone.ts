import { prisma } from '@/lib/prisma'

export function normalizePhone(input: unknown): string | null {
  const digits = String(input ?? '').replace(/\D/g, '')
  if (digits.length < 10) return null
  const ten = digits.slice(-10)
  if (!/^\d{10}$/.test(ten)) return null
  return ten
}

export async function findUserByPhone(phone: unknown) {
  const ten = normalizePhone(phone)
  if (!ten) return null

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { phone: ten },
        { phone: { endsWith: ten } },
      ],
    },
  })

  return users.find((user) => normalizePhone(user.phone) === ten) ?? null
}

export async function emailUsedBySomeoneElse(email: string | null | undefined, exceptUserId?: string) {
  const clean = email?.trim().toLowerCase()
  if (!clean) return null
  const owner = await prisma.user.findFirst({
    where: { email: clean },
  })
  if (!owner) return null
  if (exceptUserId && owner.id === exceptUserId) return null
  return owner
}
