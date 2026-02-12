import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/id-generator'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const rawPage = parseInt(searchParams.get('page') || '1')
    const rawLimit = parseInt(searchParams.get('limit') || '50')
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 100)

    const where = projectId 
      ? {
          projectId,
          project: {
            OR: [
              { creatorId: user.id }, // Пользователь создал проект
              { users: { some: { userId: user.id } } } // Пользователь является участником проекта
            ]
          }
        }
      : {
          projectId: null, // Общий чат - сообщения без проекта
          user: {
            companyId: user.companyId // Только пользователи той же компании
          }
        }

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.chatMessage.count({ where })
    ])

    return NextResponse.json({
      messages: messages.reverse(), // Показываем старые сообщения первыми
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, projectId, mentions } = body

    const message = await prisma.chatMessage.create({
      data: {
        id: generateId(),
        content,
        projectId: projectId || null,
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
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Отправляем через WebSocket
    try {
      const io = (global as any).io
      if (io) {
        if (projectId) {
          // Отправка в комнату проекта
          io.to(`project:${projectId}`).emit('new-message', message)
          console.log(`📨 Сообщение отправлено через WebSocket в проект ${projectId}`)
        } else {
          // Отправка в общий чат всем пользователям компании
          io.emit('new-message', message)
          console.log(`📨 Сообщение отправлено через WebSocket в общий чат`)
        }
      }
    } catch (socketError) {
      console.error('Ошибка отправки через WebSocket:', socketError)
    }

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
          const notifications = await Promise.all(
            mentionedUsers.map(mentionedUser =>
              prisma.notification.create({
                data: {
                  userId: mentionedUser.id,
                  title: 'Вас упомянули в чате',
                  message: `${user.name} упомянул вас${projectId && message.project ? ` в проекте "${message.project.name}"` : ''}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                  type: 'INFO',
                  projectId: projectId || null,
                  actionType: projectId ? 'project' : 'chat',
                  actionId: projectId || message.id
                }
              })
            )
          )
          
          // Отправляем уведомления через WebSocket для мгновенной доставки
          try {
            const io = (global as any).io
            if (io) {
              notifications.forEach((notification, index) => {
                io.to(`user:${mentionedUsers[index].id}`).emit('notification', notification)
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

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating chat message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
