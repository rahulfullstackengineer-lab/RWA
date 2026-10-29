import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// ============================================================
// Password Utilities
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ============================================================
// JWT Utilities
// ============================================================

export interface JWTPayload {
  userId: string
  phone: string
  role: string
  organizationId?: string
  unitId?: string
  name: string
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// ============================================================
// OTP Utilities
// ============================================================

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createOTP(userId: string, phone: string): Promise<string> {
  // Invalidate any existing OTPs
  await prisma.otpCode.updateMany({
    where: { userId, used: false },
    data: { used: true },
  })

  const code = generateOTP()
  const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000)

  await prisma.otpCode.create({
    data: { userId, phone, code, expiresAt },
  })

  // In development, print OTP to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🔑 OTP for ${phone}: ${code} (expires in 10 mins)\n`)
  }

  return code
}

export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otpRecord) return false

  // Mark OTP as used
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  })

  return true
}

// ============================================================
// Session Management
// ============================================================

export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const token = signJWT({ userId } as JWTPayload)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await prisma.session.create({
    data: { userId, token, expiresAt, userAgent, ipAddress },
  })

  return token
}

export async function validateSession(token: string) {
  const payload = verifyJWT(token)
  if (!payload) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          organization: true,
          unit: {
            include: {
              block: true,
            },
          },
        },
      },
    },
  })

  if (!session || session.expiresAt < new Date()) return null
  if (session.user.status === 'SUSPENDED') return null

  return session.user
}

export async function invalidateSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } })
}

// ============================================================
// Auth Helper for API Routes
// ============================================================

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Also check cookie
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => c.split('=').map(decodeURIComponent))
    )
    return cookies['rwa_token'] || null
  }

  return null
}

export async function requireAuth(request: Request) {
  const token = getTokenFromRequest(request)

  if (token) {
    const user = await validateSession(token)
    if (user) {
      // Determine active organization if user doesn't have one (e.g. PLATFORM_ADMIN) or if requested via header/cookie
      const headerOrg = request.headers.get('x-active-org-id')
      let cookieOrg: string | null = null
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split('; ').map(c => c.split('=').map(decodeURIComponent))
        )
        cookieOrg = cookies['rwa_active_org_id'] || null
      }
      let urlOrg: string | null = null
      try {
        const url = new URL(request.url)
        urlOrg = url.searchParams.get('orgId')
      } catch {}

      const requestedOrg = headerOrg || cookieOrg || urlOrg

      if (requestedOrg && (!user.organizationId || user.role === 'PLATFORM_ADMIN')) {
        (user as any).organizationId = requestedOrg
      } else if (!user.organizationId) {
        const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
        if (firstOrg) {
          (user as any).organizationId = firstOrg.id
        }
      }

      return { user, error: null }
    }
  }

  // Development Fallback: Check for explicit active organization header or cookie
  if (process.env.NODE_ENV !== 'production') {
    const cookieHeader = request.headers.get('cookie')
    let activeOrgId: string | null = request.headers.get('x-active-org-id')

    if (!activeOrgId && cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(c => c.split('=').map(decodeURIComponent))
      )
      activeOrgId = cookies['rwa_active_org_id'] || null
    }

    if (activeOrgId) {
      const orgUser = await prisma.user.findFirst({
        where: { organizationId: activeOrgId, role: 'RWA_ADMIN' },
        include: { organization: true, unit: true },
      })
      if (orgUser) return { user: orgUser, error: null }
    }

    // Default to the most recently registered RWA_ADMIN
    const recentUser = await prisma.user.findFirst({
      where: { role: 'RWA_ADMIN' },
      include: { organization: true, unit: true },
      orderBy: { createdAt: 'desc' },
    })
    if (recentUser) return { user: recentUser, error: null }
  }

  return { user: null, error: 'Unauthorized — please sign in' }
}

export async function requireAdmin(request: Request) {
  const { user, error } = await requireAuth(request)
  if (error || !user) return { user: null, error: error || 'Unauthorized' }

  const adminRoles = ['RWA_ADMIN', 'TREASURER', 'COMMITTEE_MEMBER', 'PLATFORM_ADMIN']
  if (!adminRoles.includes(user.role)) {
    return { user: null, error: 'Forbidden — admin access required' }
  }

  return { user, error: null }
}

export async function requirePlatformAdmin(request: Request) {
  const { user, error } = await requireAuth(request)
  if (error || !user) return { user: null, error: error || 'Unauthorized' }

  // Strictly enforce 8219587657 or PLATFORM_ADMIN
  const isSuperAdmin = user.phone === '8219587657' || user.role === 'PLATFORM_ADMIN'
  if (!isSuperAdmin) {
    return { user: null, error: 'Forbidden — Platform Super-Admin portal is restricted to authorized personnel only (8219587657)' }
  }

  return { user, error: null }
}


