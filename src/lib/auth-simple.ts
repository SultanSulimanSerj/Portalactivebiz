import { NextRequest } from 'next/server'

export interface User {
  id: string
  email: string
  name: string
  role: string
  companyId: string
}

export async function authenticateUser(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    
    // Простая проверка токена для демо
    if (token === 'demo-token') {
      return {
        id: '1',
        email: 'admin@company.com',
        name: 'Администратор',
        role: 'ADMIN',
        companyId: '1'
      }
    }

    return null
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}