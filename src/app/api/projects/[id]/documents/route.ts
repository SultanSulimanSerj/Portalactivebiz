import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { verifyProjectCompanyAccess } from '@/lib/access-control'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parseDocumentContent } from '@/lib/document-editor/types'

const CATEGORY_MAP: Record<string, string> = {
  INVOICE: 'INVOICE',
  CONTRACT: 'CONTRACT',
  COMMERCIAL: 'COMMERCIAL',
  COMMERCIAL_OFFER: 'COMMERCIAL',
  UPD: 'UPD',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllDocuments')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!allowed) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }
    if (!user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const hasAccess = await verifyProjectCompanyAccess(user, params.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 })
    }

    const categoryParam = request.nextUrl.searchParams.get('category')
    const categories = categoryParam
      ? categoryParam
          .split(',')
          .map((c) => CATEGORY_MAP[c.trim()] ?? c.trim())
          .filter(Boolean)
      : undefined

    const documents = await prisma.document.findMany({
      where: {
        projectId: params.id,
        OR: [{ companyId: user.companyId }, { companyId: null, creator: { companyId: user.companyId } }],
        ...(categories?.length ? { category: { in: categories } } : {}),
        contentJson: { not: Prisma.DbNull },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        documentNumber: true,
        editorStatus: true,
        contentJson: true,
        createdAt: true,
      },
    })

    const items = documents
      .filter((doc) => parseDocumentContent(doc.contentJson))
      .map((doc) => {
        const content = parseDocumentContent(doc.contentJson)!
        const data = content.data as unknown as Record<string, unknown>
        const documentDate =
          (data.documentDate as string) ||
          (data.offerDate as string) ||
          (data.contractDate as string) ||
          null
        return {
          id: doc.id,
          title: doc.title,
          category: doc.category,
          documentNumber: doc.documentNumber,
          documentDate,
          editorStatus: doc.editorStatus,
          createdAt: doc.createdAt.toISOString(),
        }
      })

    return NextResponse.json({ documents: items })
  } catch (err) {
    console.error('Error listing project documents:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
