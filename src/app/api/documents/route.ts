import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { notifyDocumentUpload } from '@/lib/notifications'
import { UserRole } from '@/lib/permissions'
import { generateId } from '@/lib/id-generator'

export async function GET(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllDocuments')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')

    // Фильтрация документов в зависимости от роли пользователя
    let where: any = {
      creator: {
        companyId: user.companyId
      },
      ...(projectId && { projectId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }

    // OWNER и ADMIN видят все документы компании
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      // Никаких дополнительных ограничений
    } else {
      // MANAGER и USER видят только документы проектов, где являются участниками
      where.OR = [
        { projectId: null }, // Документы без проекта (общие)
        { 
          project: {
            OR: [
              { creatorId: user.id }, // Пользователь создал проект
              { ProjectUser: { some: { userId: user.id } } } // Пользователь является участником проекта
            ]
          }
        }
      ]
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          project: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.document.count({ where })
    ])

    console.log('=== API /api/documents ===')
    console.log('Найдено документов:', documents.length)
    console.log('Первый документ:', documents[0] ? {
      id: documents[0].id,
      title: documents[0].title,
      projectId: documents[0].projectId,
      project: documents[0].project
    } : 'Нет документов')

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canCreateDocuments')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, projectId } = body

    const document = await prisma.document.create({
      data: {
        id: generateId(),
        title,
        description: description || null,
        fileName: 'temp.txt',
        filePath: 'temp.txt',
        fileSize: 0,
        mimeType: 'text/plain',
        version: 1,
        documentNumber: `DOC-${Date.now()}`,
        creatorId: user.id,
        projectId: projectId || null,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    })

    // Отправляем уведомления участникам проекта
    if (projectId && document.project) {
      try {
        // Получаем участников проекта
        const projectUsers = await prisma.projectUser.findMany({
          where: { projectId },
          select: { userId: true }
        })

        const participantIds = projectUsers.map(pu => pu.userId)
        
        if (participantIds.length > 0) {
          await notifyDocumentUpload(
            document.id,
            projectId,
            participantIds,
            title,
            document.project.name,
            user.email || 'Пользователь'
          )
        }
      } catch (notificationError) {
        console.error('Error sending document upload notifications:', notificationError)
        // Не прерываем создание документа из-за ошибки уведомлений
      }
    }

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}