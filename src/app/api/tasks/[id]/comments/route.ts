import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/id-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
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

    const body = await request.json()
    const { content, mentions } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Получаем задачу для companyId
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, companyId: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const comment = await prisma.taskComment.create({
      data: {
        id: generateId(),
        content: content.trim(),
        taskId: params.id,
        userId: user.id,
        companyId: task.companyId || user.companyId || null,
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

    // Отправляем уведомления упомянутым пользователям
    if (mentions && mentions.length > 0) {
      try {
        const mentionedUsers = await prisma.user.findMany({
          where: {
            name: { in: mentions },
            companyId: user.companyId,
            id: { not: user.id }
          },
          select: { id: true, name: true }
        })

        if (mentionedUsers.length > 0) {
          await Promise.all(
            mentionedUsers.map(mentionedUser =>
              prisma.notification.create({
                data: {
                  userId: mentionedUser.id,
                  title: 'Вас упомянули в комментарии',
                  message: `${user.name} упомянул вас в задаче "${task.title}": ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                  type: 'INFO',
                  actionType: 'task',
                  actionId: params.id
                }
              })
            )
          )

          // Отправляем уведомления через WebSocket для мгновенной доставки
          try {
            const io = (global as any).io
            if (io) {
              mentionedUsers.forEach((mentionedUser) => {
                io.to(`user:${mentionedUser.id}`).emit('notification', {
                  title: 'Вас упомянули в комментарии',
                  message: `${user.name} упомянул вас в задаче "${task.title}": ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                  type: 'INFO',
                  actionType: 'task',
                  actionId: params.id
                })
              })
            }
          } catch (wsError) {
            console.error('Ошибка отправки уведомлений через WebSocket:', wsError)
          }

          console.log(`🔔 Отправлены уведомления об упоминании для ${mentionedUsers.length} пользователей`)
        }
      } catch (notificationError) {
        console.error('Ошибка отправки уведомлений об упоминании:', notificationError)
      }
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
