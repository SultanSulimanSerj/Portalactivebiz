import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { getExportJobForCompany } from '@/lib/document-export/export-job-service'
import { getDocumentForCompany } from '@/lib/document-editor/document-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
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

    const job = await getExportJobForCompany(params.jobId, user.companyId)
    if (!job) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 })
    }

    let document = null
    if (job.status === 'COMPLETED') {
      document = await getDocumentForCompany(job.documentId, user.companyId)
    }

    return NextResponse.json({
      job,
      document,
      downloadUrl:
        job.status === 'COMPLETED'
          ? `/api/documents/${job.documentId}/download`
          : undefined,
    })
  } catch (err) {
    console.error('Error fetching export job:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
