import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where = {
      companyId: user.companyId,
      ...(status && { status })
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        users: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        finances: {
          select: {
            type: true,
            amount: true
          }
        },
        _count: {
          select: {
            tasks: true,
            documents: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    // Calculate financial data for each project
    const projectsWithFinances = projects.map(project => {
      const income = project.finances
        .filter(f => f.type === 'INCOME')
        .reduce((sum, f) => sum + Number(f.amount), 0)
      
      const expenses = project.finances
        .filter(f => f.type === 'EXPENSE')
        .reduce((sum, f) => sum + Number(f.amount), 0)
      
      const profit = income - expenses
      const margin = income > 0 ? ((profit / income) * 100) : 0

      return {
        ...project,
        financialSummary: {
          income,
          expenses,
          profit,
          margin: parseFloat(margin.toFixed(1))
        }
      }
    })

    const total = await prisma.project.count({ where })

    return NextResponse.json({
      projects: projectsWithFinances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
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
    const { name, description, startDate, endDate, budget, priority } = body

    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        priority,
        companyId: user.companyId,
        creatorId: user.id
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
