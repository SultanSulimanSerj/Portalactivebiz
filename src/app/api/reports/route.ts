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
    const period = searchParams.get('period') || 'month'
    const type = searchParams.get('type') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Получаем статистику проектов
    const projects = await prisma.project.findMany({
      where: {
        companyId: user.companyId
      },
      include: {
        _count: {
          select: {
            tasks: true,
            documents: true
          }
        }
      }
    })

    // Получаем финансовые данные
    const finances = await prisma.finance.findMany({
      where: {
        project: {
          companyId: user.companyId
        }
      }
    })

    // Получаем задачи
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          companyId: user.companyId
        }
      },
      include: {
        project: true
      }
    })

    // Получаем пользователей
    const users = await prisma.user.findMany({
      where: {
        companyId: user.companyId
      },
      include: {
        _count: {
          select: {
            createdProjects: true,
            createdTasks: true
          }
        }
      }
    })

    // Получаем документы
    const documents = await prisma.document.findMany({
      where: {
        project: {
          companyId: user.companyId
        }
      }
    })

    // Вычисляем статистику
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length
    
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
    
    const totalDocuments = documents.length
    
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.isActive).length

    // Финансовая статистика
    const totalRevenue = finances
      .filter(f => f.type === 'INCOME')
      .reduce((sum, f) => {
        const amount = Number(f.amount) || 0
        return sum + amount
      }, 0)
    
    const totalExpenses = finances
      .filter(f => f.type === 'EXPENSE')
      .reduce((sum, f) => {
        const amount = Number(f.amount) || 0
        return sum + amount
      }, 0)
    
    const netProfit = totalRevenue - totalExpenses
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Логирование для отладки
    console.log('Financial data:', {
      totalRevenue,
      totalExpenses,
      netProfit,
      margin,
      financesCount: finances.length
    })

    // Статистика по периодам
    const now = new Date()
    const getDateFilter = (period: string) => {
      const date = new Date()
      switch (period) {
        case 'week':
          date.setDate(date.getDate() - 7)
          break
        case 'month':
          date.setMonth(date.getMonth() - 1)
          break
        case 'quarter':
          date.setMonth(date.getMonth() - 3)
          break
        case 'year':
          date.setFullYear(date.getFullYear() - 1)
          break
      }
      return date
    }

    const periodStart = getDateFilter(period)
    const recentProjects = projects.filter(p => new Date(p.createdAt) >= periodStart).length
    const recentTasks = tasks.filter(t => new Date(t.createdAt) >= periodStart).length
    const recentDocuments = documents.filter(d => new Date(d.createdAt) >= periodStart).length

    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalDocuments,
      totalUsers,
      activeUsers,
      totalRevenue,
      totalExpenses,
      netProfit,
      margin: Math.round(margin * 10) / 10,
      recentProjects,
      recentTasks,
      recentDocuments
    }

    return NextResponse.json({
      success: true,
      stats,
      projects: projects.slice(0, 10), // Ограничиваем для производительности
      tasks: tasks.slice(0, 10),
      users: users.slice(0, 10),
      documents: documents.slice(0, 10)
    })

  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
