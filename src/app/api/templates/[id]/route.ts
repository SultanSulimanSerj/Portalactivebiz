import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { getSystemTemplateById } from '@/lib/system-templates'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllDocuments')

    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const systemTemplate = getSystemTemplateById(params.id)
    if (systemTemplate) {
      return NextResponse.json({
        id: systemTemplate.id,
        name: systemTemplate.name,
        description: systemTemplate.description,
        category: systemTemplate.category,
        type: systemTemplate.type,
        fileType: systemTemplate.fileType,
        content: systemTemplate.content,
        variables: systemTemplate.variables,
        autoNumber: systemTemplate.autoNumber,
        numberFormat: systemTemplate.numberFormat,
        autoFillSources: systemTemplate.autoFillSources,
        isActive: true,
        isPublic: true,
        companyId: null,
        creatorId: null,
        _count: { documents: 0 },
      })
    }

    const template = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { documents: true } },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Шаблон не найден' }, { status: 404 })
    }

    if (template.companyId && template.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canEditDocuments')

    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    if (getSystemTemplateById(params.id)) {
      return NextResponse.json(
        { error: 'Системные шаблоны нельзя редактировать' },
        { status: 403 }
      )
    }

    const template = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Шаблон не найден' }, { status: 404 })
    }

    if (template.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, content, variables, isActive } = body

    const updatedTemplate = await prisma.documentTemplate.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(content && { content }),
        ...(variables && { variables }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canDeleteDocuments')

    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    if (getSystemTemplateById(params.id)) {
      return NextResponse.json(
        { error: 'Системные шаблоны нельзя удалять' },
        { status: 403 }
      )
    }

    const template = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
      include: { _count: { select: { documents: true } } },
    })

    if (!template) {
      return NextResponse.json({ error: 'Шаблон не найден' }, { status: 404 })
    }

    if (template.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (template._count.documents > 0) {
      return NextResponse.json(
        { error: `Невозможно удалить шаблон. Из него создано документов: ${template._count.documents}` },
        { status: 400 }
      )
    }

    await prisma.documentTemplate.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Шаблон удален' })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
