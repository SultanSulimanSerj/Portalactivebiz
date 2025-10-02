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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = projectId 
      ? {
          projectId,
          project: {
            OR: [
              { creatorId: user.id }, // Пользователь создал проект
              { ProjectUser: { some: { userId: user.id } } } // Пользователь является участником проекта
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
    const { content, projectId, attachments } = body

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

    // Проверяем упоминания в сообщении (@username)
    const mentionRegex = /@(\w+)/g
    const mentions = content.match(mentionRegex)
    
    if (mentions && mentions.length > 0) {
      try {
        // Получаем пользователей компании для поиска упоминаний
        const companyUsers = await prisma.user.findMany({
          where: { companyId: user.companyId },
          select: { id: true, name: true, email: true }
        })

        const mentionedUserIds: string[] = []
        
        for (const mention of mentions) {
          const username = mention.substring(1) // Убираем @
          const mentionedUser = companyUsers.find(u => 
            u.name?.toLowerCase().includes(username.toLowerCase()) ||
            u.email?.toLowerCase().includes(username.toLowerCase())
          )
          if (mentionedUser && mentionedUser.id !== user.id) {
            mentionedUserIds.push(mentionedUser.id)
          }
        }

        // Уведомления отключены для упрощения
      } catch (notificationError) {
        console.error('Error sending chat mention notifications:', notificationError)
        // Не прерываем отправку сообщения из-за ошибки уведомлений
      }
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating chat message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
