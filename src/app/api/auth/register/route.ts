import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, address, companyName, companyDescription } = body

    // Валидация
    if (!name || !email || !password || !companyName) {
      return NextResponse.json({ error: 'Все обязательные поля должны быть заполнены' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Пароль должен содержать минимум 6 символов' }, { status: 400 })
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 400 })
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)

    // Создаем компанию и пользователя в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем компанию
      const company = await tx.company.create({
        data: {
          name: companyName,
          description: companyDescription || null
        }
      })

      // Создаем пользователя как владельца компании
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'OWNER',
          position: 'Владелец',
          companyId: company.id,
          phone: phone || null,
          address: address || null
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          position: true,
          companyId: true
        }
      })

      return { user, company }
    })

    return NextResponse.json({
      message: 'Регистрация прошла успешно',
      user: result.user,
      company: result.company
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Ошибка регистрации' }, { status: 500 })
  }
}