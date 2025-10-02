import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/permissions'
import { generateId } from '@/lib/id-generator'

export async function GET(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canCreateApprovals')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where = {
      OR: [
        // Пользователь является создателем согласования
        {
          creatorId: user.id
        },
        // Пользователь является участником согласования
        {
          assignments: {
            some: {
              userId: user.id
            }
          }
        }
      ],
      // Дополнительно проверяем, что согласование принадлежит компании пользователя
      creator: {
        companyId: user.companyId
      },
      ...(status && { status: status as any }),
      ...(type && { type: type as any })
    }

    const [approvals, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          project: {
            select: { id: true, name: true }
          },
          document: {
            select: { id: true, title: true, isPublished: true }
          },
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          comments: {
            include: {
              user: {
                select: { id: true, name: true }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          },
          attachments: {
            include: {
              uploadedBy: {
                select: { id: true, name: true }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          _count: {
            select: {
              comments: true,
              attachments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.approval.count({ where })
    ])

    return NextResponse.json({
      approvals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching approvals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canCreateApprovals')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      type, 
      documentId, 
      projectId, 
      assigneeIds, 
      priority, 
      dueDate,
      requireAllApprovals,
      autoPublishOnApproval,
      roles 
    } = body

    const approval = await prisma.approval.create({
      data: {
        id: generateId(),
        title,
        description: description || null,
        type,
        status: 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        requireAllApprovals: requireAllApprovals || false,
        autoPublishOnApproval: autoPublishOnApproval !== undefined ? autoPublishOnApproval : true,
        creatorId: user.id,
        updatedAt: new Date(),
        ...(documentId && { documentId }),
        ...(projectId && { projectId }),
        assignments: {
          create: assigneeIds?.map((userId: string, index: number) => ({
            id: generateId(),
            userId,
            status: 'PENDING',
            role: roles?.[userId] || 'APPROVER',
            order: index,
            updatedAt: new Date()
          })) || []
        }
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            isPublished: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      }
    })

    // Добавляем запись в историю
    await prisma.approvalHistory.create({
      data: {
        id: generateId(),
        action: 'created',
        changes: {
          title,
          type,
          assigneeIds
        },
        approvalId: approval.id,
        userId: user.id
      }
    })

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    console.error('Error creating approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
