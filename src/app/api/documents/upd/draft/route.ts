import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { verifyProjectCompanyAccess } from '@/lib/access-control'
import { createUpdDraft } from '@/lib/document-editor/document-service'

export async function POST(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canCreateDocuments')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!allowed) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }
    if (!user.companyId) {
      return NextResponse.json({ error: 'Компания не найдена' }, { status: 400 })
    }

    const body = await request.json()
    const { projectId, invoiceDocumentId, contractDocumentId, documentNumber, updStatus } = body

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'Укажите проект' }, { status: 400 })
    }

    if (!invoiceDocumentId || typeof invoiceDocumentId !== 'string') {
      return NextResponse.json(
        { error: 'Для УПД необходимо выбрать счёт-основание' },
        { status: 400 }
      )
    }

    const hasAccess = await verifyProjectCompanyAccess(user, projectId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 })
    }

    const document = await createUpdDraft({
      projectId,
      companyId: user.companyId,
      creatorId: user.id,
      invoiceDocumentId,
      contractDocumentId:
        typeof contractDocumentId === 'string' ? contractDocumentId : undefined,
      documentNumber: typeof documentNumber === 'string' ? documentNumber : null,
      updStatus: updStatus === 1 ? 1 : 2,
    })

    return NextResponse.json({
      document,
      documentId: document.id,
      redirectUrl: `/documents/${document.id}/edit`,
    })
  } catch (err) {
    console.error('Error creating UPD draft:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ошибка при создании черновика' },
      { status: 500 }
    )
  }
}
