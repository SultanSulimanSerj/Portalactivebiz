import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from './prisma'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string | null
}

const activeUserCache = new Map<string, { active: boolean; expiresAt: number }>()
const ACTIVE_CACHE_TTL_MS = 60_000

async function isUserActive(userId: string): Promise<boolean> {
  const cached = activeUserCache.get(userId)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.active
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  })
  const active = user?.isActive ?? false
  activeUserCache.set(userId, { active, expiresAt: Date.now() + ACTIVE_CACHE_TTL_MS })
  return active
}

/** Auth from JWT + cached isActive check (max 1 DB hit per user per minute). */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token?.sub) {
      return null
    }

    const active = await isUserActive(token.sub)
    if (!active) {
      return null
    }

    return {
      id: token.sub,
      email: (token.email as string) || '',
      name: (token.name as string) || '',
      role: (token.role as string) || 'USER',
      companyId: (token.companyId as string | null) ?? null,
    }
  } catch {
    return null
  }
}

/** Force DB refresh — use when permissions must be verified against live data. */
export async function authenticateUserFromDb(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.sub) return null

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, email: true, name: true, role: true, companyId: true, isActive: true },
    })

    if (!user || !user.isActive) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
      companyId: user.companyId,
    }
  } catch {
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await authenticateUser(request)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(request: NextRequest, allowedRoles: string[]): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  return user
}

export async function loginDemoUser(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    })

    if (!user || !user.password) {
      return null
    }

    const bcrypt = require('bcryptjs')
    const passwordValid = await bcrypt.compare(password, user.password)

    if (!passwordValid || !user.isActive) {
      return null
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role,
        companyId: user.companyId,
      },
      token,
    }
  } catch {
    return null
  }
}
