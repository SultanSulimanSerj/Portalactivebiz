import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const approval = await prisma.approval.findFirst({
      where: {
        id: params.id,
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
        }
      },
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
          orderBy: { createdAt: 'desc' }
        },
        attachments: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      }
    })

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found or access denied' }, { status: 404 })
    }

    return NextResponse.json(approval)
  } catch (error) {
    console.error('Error fetching approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, comment } = body

    // Сначала проверяем, что пользователь имеет право обновлять это согласование
    const existingApproval = await prisma.approval.findFirst({
      where: {
        id: params.id,
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
        }
      }
    })

    if (!existingApproval) {
      return NextResponse.json({ error: 'Approval not found or access denied' }, { status: 404 })
    }

    const approval = await prisma.approval.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'APPROVED' && { approvedAt: new Date() }),
        ...(status === 'REJECTED' && { rejectedAt: new Date() }),
        updatedAt: new Date()
      },
      include: {
        document: {
          select: {
            id: true,
            title: true
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
        }
      }
    })

    return NextResponse.json(approval)
  } catch (error) {
    console.error('Error updating approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.approval.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
