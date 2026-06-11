import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import {
  listDocumentVersions,
  restoreDocumentVersion,
} from '@/lib/document-editor/document-service'

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

    const result = await listDocumentVersions(params.id, user.companyId)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Error listing versions:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ошибка при загрузке версий' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { versionId } = body

    if (!versionId || typeof versionId !== 'string') {
      return NextResponse.json({ error: 'Укажите versionId' }, { status: 400 })
    }

    const document = await restoreDocumentVersion(params.id, user.companyId, versionId)

    return NextResponse.json({ document })
  } catch (err) {
    console.error('Error restoring version:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ошибка при восстановлении версии' },
      { status: 500 }
    )
  }
}
