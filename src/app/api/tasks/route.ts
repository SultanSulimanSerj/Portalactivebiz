import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth-api'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const projectId = searchParams.get('projectId')

    const where = {
      ...(projectId ? { projectId } : {}),
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true }
          },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
          creator: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where })
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
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
    const { title, description, status, priority, startDate, dueDate, projectId, assigneeIds } = body

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
        creatorId: user.id,
        ...(assigneeIds && assigneeIds.length > 0 && {
          assignments: {
            create: assigneeIds.map((userId: string) => ({
              userId
            }))
          }
        })
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
