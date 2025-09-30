import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем права доступа (только OWNER и ADMIN могут приглашать)
    if (!['OWNER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Недостаточно прав для приглашения пользователей' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, role, position } = body

    // Валидация
    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Email, имя и роль обязательны' }, { status: 400 })
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 400 })
    }

    // Генерируем временный пароль
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Создаем пользователя
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        position: position || 'Сотрудник',
        companyId: user.companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        createdAt: true
      }
    })

    // В реальном приложении здесь бы отправлялся email с приглашением
    // Пока просто возвращаем данные пользователя и временный пароль
    return NextResponse.json({
      message: 'Пользователь успешно приглашен',
      user: newUser,
      tempPassword // В продакшене это не должно возвращаться
    }, { status: 201 })

  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Ошибка приглашения пользователя' }, { status: 500 })
  }
}
