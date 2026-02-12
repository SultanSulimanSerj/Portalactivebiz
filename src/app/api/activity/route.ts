import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllProjects')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const rawLimit = parseInt(searchParams.get('limit') || '10')
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 10 : Math.min(rawLimit, 50)

    // Получаем последние проекты, задачи и документы
    const [recentProjects, recentTasks, recentDocuments] = await Promise.all([
      prisma.project.findMany({
        where: { companyId: user.companyId },
        include: {
          creator: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.task.findMany({
        where: { 
          project: { companyId: user.companyId }
        },
        include: {
          creator: { select: { name: true } },
          project: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.document.findMany({
        where: { 
          creator: { companyId: user.companyId }
        },
        include: {
          creator: { select: { name: true } },
          project: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    // Формируем активность
    const activities: any[] = []

    // Добавляем проекты
    recentProjects.forEach(project => {
      activities.push({
        id: `project-${project.id}`,
        type: 'project',
        action: 'создал проект',
        title: project.name,
        subtitle: project.description?.substring(0, 50) || undefined,
        userName: project.creator?.name || 'Пользователь',
        createdAt: project.createdAt,
        icon: 'FolderOpen',
        color: 'blue'
      })
    })

    // Добавляем задачи
    recentTasks.forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        type: 'task',
        action: 'создал задачу',
        title: task.title,
        subtitle: task.project?.name ? `в проекте "${task.project.name}"` : undefined,
        userName: task.creator?.name || 'Пользователь',
        createdAt: task.createdAt,
        icon: 'CheckCircle',
        color: 'green'
      })
    })

    // Добавляем документы
    recentDocuments.forEach(doc => {
      activities.push({
        id: `document-${doc.id}`,
        type: 'document',
        action: 'загрузил документ',
        title: doc.title,
        subtitle: doc.project?.name ? `в проекте "${doc.project.name}"` : undefined,
        userName: doc.creator?.name || 'Пользователь',
        createdAt: doc.createdAt,
        icon: 'FileText',
        color: 'purple'
      })
    })

    // Сортируем по дате (новые первыми) и ограничиваем количество
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    return NextResponse.json({
      activities: sortedActivities
    })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Ошибка при получении активности' }, { status: 500 })
  }
}
