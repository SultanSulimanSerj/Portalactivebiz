import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string | null
}

export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Получаем сессию из NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return null
    }

    // Получаем полную информацию о пользователе из БД
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
      companyId: user.companyId
    }
  } catch (error) {
    console.error('Auth error:', error)
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
