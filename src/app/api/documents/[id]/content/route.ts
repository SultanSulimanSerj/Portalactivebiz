import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { saveDocumentContent } from '@/lib/document-editor/document-service'
import { isEditableDocumentContent } from '@/lib/document-editor/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canEditDocuments')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!allowed) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }
    if (!user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || !isEditableDocumentContent(content)) {
      return NextResponse.json({ error: 'Некорректное содержимое документа' }, { status: 400 })
    }

    const document = await saveDocumentContent(params.id, user.companyId, content)

    return NextResponse.json({ document })
  } catch (err) {
    console.error('Error saving document content:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ошибка при сохранении' },
      { status: 500 }
    )
  }
}
