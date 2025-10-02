/**
 * API для работы с системными шаблонами документов
 * GET /api/templates - получение списка системных шаблонов
 * POST /api/templates - НЕ ПОДДЕРЖИВАЕТСЯ (только системные шаблоны)
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { getAllSystemTemplates, getSystemTemplatesByCategory } from '@/lib/system-templates'

export async function GET(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllDocuments')

    if (!allowed) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Получаем системные шаблоны
    let templates = getAllSystemTemplates()

    // Фильтруем по категории если указана
    if (category) {
      templates = getSystemTemplatesByCategory(category)
    }

    // Преобразуем в формат, совместимый с фронтендом
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      type: template.type,
      fileType: template.fileType,
      content: template.content,
      variables: template.variables,
      autoNumber: template.autoNumber,
      numberFormat: template.numberFormat,
      autoFillSources: template.autoFillSources,
      // Системные шаблоны всегда активны и публичны
      isActive: true,
      isPublic: true,
      companyId: null, // Системные шаблоны
      creatorId: null, // Системные шаблоны
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Дополнительные поля для совместимости
      requiresApproval: false,
      _count: {
        documents: 0 // Пока не реализовано
      }
    }))

    console.log('[DEBUG] System templates found:', formattedTemplates.length)
    console.log('[DEBUG] Templates:', formattedTemplates.map(t => ({ id: t.id, name: t.name, category: t.category })))

    return NextResponse.json({ templates: formattedTemplates }, { status: 200 })
  } catch (error) {
    console.error('Error fetching system templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Убираем возможность создания пользовательских шаблонов
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Создание пользовательских шаблонов не поддерживается. Используйте только системные шаблоны.' },
    { status: 405 }
  )
}
