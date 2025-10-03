import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { canUserAccessProject } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/id-generator'
import { UserRole } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем доступ к проекту
    const hasAccess = await canUserAccessProject(
      user.id,
      params.id,
      user.companyId!,
      (user.role || 'USER') as UserRole
    )

    if (!hasAccess) {
      return NextResponse.json({ error: 'Нет доступа к этому проекту' }, { status: 403 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { projectId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем доступ к проекту
    const hasAccess = await canUserAccessProject(
      user.id,
      params.id,
      user.companyId!,
      (user.role || 'USER') as UserRole
    )

    if (!hasAccess) {
      return NextResponse.json({ error: 'Нет доступа к этому проекту' }, { status: 403 })
    }

    const body = await request.json()
    const { content, mentions } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const message = await prisma.chatMessage.create({
      data: {
        id: generateId(),
        content: content.trim(),
        projectId: params.id,
        userId: user.id,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Отправляем сообщение через WebSocket всем участникам проекта
    try {
      const io = (global as any).io
      if (io) {
        io.to(`project:${params.id}`).emit('new-message', message)
        console.log(`📨 Сообщение отправлено через WebSocket в проект ${params.id}`)
      }
    } catch (socketError) {
      console.error('Ошибка отправки через WebSocket:', socketError)
      // Не прерываем выполнение, если WebSocket не работает
    }

    // Отправляем уведомления упомянутым пользователям
    if (mentions && mentions.length > 0) {
      try {
        // Получаем проект для названия
        const project = await prisma.project.findUnique({
          where: { id: params.id },
          select: { name: true }
        })

        // Находим пользователей по именам
        const mentionedUsers = await prisma.user.findMany({
          where: {
            name: { in: mentions },
            companyId: user.companyId,
            id: { not: user.id } // Не отправляем уведомление самому себе
          },
          select: { id: true, name: true }
        })

        // Создаём уведомления для упомянутых пользователей
        if (mentionedUsers.length > 0) {
          await Promise.all(
            mentionedUsers.map(mentionedUser =>
              prisma.notification.create({
                data: {
                  userId: mentionedUser.id,
                  title: 'Вас упомянули в чате',
                  message: `${user.name} упомянул вас в проекте "${project?.name}": ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                  type: 'INFO',
                  projectId: params.id,
                  actionType: 'project',
                  actionId: params.id
                }
              })
            )
          )
          console.log(`🔔 Отправлены уведомления об упоминании для ${mentionedUsers.length} пользователей`)
        }
      } catch (notificationError) {
        console.error('Ошибка отправки уведомлений об упоминании:', notificationError)
        // Не прерываем выполнение
      }
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
