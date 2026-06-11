/**
 * API для работы с шаблонами документов
 * GET /api/templates - системные + пользовательские шаблоны компании
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { getAllSystemTemplates, getSystemTemplatesByCategory } from '@/lib/system-templates'

export async function GET(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllDocuments')

    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let systemTemplates = getAllSystemTemplates()
    if (category) {
      systemTemplates = getSystemTemplatesByCategory(category)
    }

    const formattedSystem = systemTemplates.map((template) => ({
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
      isActive: true,
      isPublic: true,
      companyId: null,
      creatorId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requiresApproval: false,
      _count: { documents: 0 },
    }))

    const dbTemplatesFormatted =
      user.companyId
        ? (
            await prisma.documentTemplate.findMany({
              where: { companyId: user.companyId, isActive: true },
              include: { _count: { select: { documents: true } } },
              orderBy: { updatedAt: 'desc' },
            })
          )
            .filter((t) => !category || category === 'OTHER')
            .map((template) => ({
              id: template.id,
              name: template.name,
              description: template.description || '',
              category: 'OTHER',
              type: 'CUSTOM',
              fileType: 'HTML',
              content: template.content,
              variables: template.variables,
              autoNumber: false,
              numberFormat: '',
              autoFillSources: template.variables,
              isActive: template.isActive,
              isPublic: false,
              companyId: template.companyId,
              creatorId: null,
              createdAt: template.createdAt.toISOString(),
              updatedAt: template.updatedAt.toISOString(),
              requiresApproval: false,
              _count: { documents: template._count.documents },
            }))
        : []

    return NextResponse.json(
      { templates: [...formattedSystem, ...dbTemplatesFormatted] },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Создание пользовательских шаблонов через этот endpoint не поддерживается. Используйте системные шаблоны.',
    },
    { status: 405 }
  )
}
