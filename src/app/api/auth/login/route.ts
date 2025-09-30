import { NextRequest, NextResponse } from 'next/server'
import { loginDemoUser } from '@/lib/auth-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const result = await loginDemoUser(email, password)
    
    if (!result) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Устанавливаем cookie с токеном
    const response = NextResponse.json({ 
      user: result.user,
      message: 'Login successful' 
    })
    
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 дней
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
