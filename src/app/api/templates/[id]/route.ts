/**
 * API для работы с конкретным шаблоном
 * GET /api/templates/[id] - получение шаблона
 * PUT /api/templates/[id] - обновление шаблона
 * DELETE /api/templates/[id] - удаление шаблона
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllProjects')

    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const template = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Шаблон не найден' }, { status: 404 })
    }

    if (template.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    return NextResponse.json(template, { status: 200 })
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
    const {
      name,
      description,
      content,
      variables,
      isActive,
      isPublic,
      autoNumber,
      numberFormat,
      requiresApproval,
    } = body

    // Обновляем версию при изменении контента
    const shouldIncrementVersion = content && content !== template.content

    const updatedTemplate = await prisma.documentTemplate.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(content && { content }),
        ...(variables && { variables }),
        ...(isActive !== undefined && { isActive }),
        ...(isPublic !== undefined && { isPublic }),
        ...(autoNumber !== undefined && { autoNumber }),
        ...(numberFormat !== undefined && { numberFormat }),
        updatedAt: new Date(),
        ...(requiresApproval !== undefined && { requiresApproval }),
      },
    })

    return NextResponse.json(updatedTemplate, { status: 200 })
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

    const template = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Шаблон не найден' }, { status: 404 })
    }

    if (template.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Проверяем, есть ли документы, созданные из этого шаблона
    if (template._count.documents > 0) {
      return NextResponse.json(
        { error: `Невозможно удалить шаблон. Из него создано документов: ${template._count.documents}` },
        { status: 400 }
      )
    }

    await prisma.documentTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Шаблон удален' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
