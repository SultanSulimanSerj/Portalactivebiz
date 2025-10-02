import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
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
    // Получаем токен из NextAuth JWT
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token?.sub) {
      console.log('No token or user ID found')
      return null
    }

    console.log('Token found:', { userId: token.sub, email: token.email })

    // Получаем полную информацию о пользователе из БД
    const user = await prisma.user.findUnique({
      where: {
        id: token.sub
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
      console.log('User not found in database:', token.sub)
      return null
    }

    console.log('User authenticated:', { id: user.id, email: user.email, companyId: user.companyId })

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
    console.log('Authentication failed - no user found')
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
    // Ищем пользователя в базе данных
    const user = await prisma.user.findUnique({
      where: { email },
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
      console.log('User not found:', email)
      return null
    }

    // Проверяем пароль (в демо-версии используем простую проверку)
    if (user.password !== password) {
      console.log('Invalid password for user:', email)
      return null
    }

    // Генерируем простой токен для демо-версии
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role,
        companyId: user.companyId
      },
      token
    }
  } catch (error) {
    console.error('Login demo user error:', error)
    return null
  }
}
