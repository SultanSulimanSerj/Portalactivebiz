import { NextRequest, NextResponse } from 'next/server'
import { checkPermission, canUserAccessProject } from '@/lib/auth-middleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient() as any

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewEstimates')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Проверяем доступ к проекту
    const hasAccess = await canUserAccessProject(user.id, params.id, user.companyId, user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Нет доступа к этому проекту' }, { status: 403 })
    }

    const estimates = await prisma.estimate.findMany({
      where: {
        projectId: params.id,
        project: {
          companyId: user.companyId
        }
      },
      include: {
        items: true,
        creator: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(estimates)
  } catch (error) {
    console.error('Error fetching estimates:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canCreateEstimates')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Проверяем доступ к проекту
    const hasAccess = await canUserAccessProject(user.id, params.id, user.companyId, user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Нет доступа к этому проекту' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Название сметы обязательно' }, { status: 400 })
    }

    // Проверяем, что проект существует и принадлежит компании пользователя
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 })
    }

    // Создаем смету
    const estimate = await prisma.estimate.create({
      data: {
        name,
        description: description || null,
        projectId: params.id,
        creatorId: user.id,
        total: 0,
        totalCost: 0,
        profit: 0,
        vatEnabled: false,
        vatRate: 20,
        vatAmount: 0,
        totalWithVat: 0
      },
      include: {
        items: true,
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(estimate)
  } catch (error) {
    console.error('Error creating estimate:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
