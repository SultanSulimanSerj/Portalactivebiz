import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSignedUrl } from '@/lib/storage'

function isMinIOKey(filePath: string): boolean {
  return filePath.startsWith('documents/') || filePath.startsWith('stages/') || filePath.startsWith('approvals/')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        OR: [
          { companyId: user.companyId },
          { companyId: null, creator: { companyId: user.companyId } }
        ]
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (isMinIOKey(document.filePath)) {
      const downloadUrl = await getSignedUrl(document.filePath, 3600)
      return NextResponse.redirect(downloadUrl)
    }

    const uploadsDir = join(process.cwd(), 'uploads')
    const filePath = join(uploadsDir, document.filePath)
    try {
      const fileBuffer = await readFile(filePath)
      let mimeType = document.mimeType
      if (document.filePath.endsWith('.docx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      } else if (document.filePath.endsWith('.pdf')) {
        mimeType = 'application/pdf'
      } else if (document.filePath.endsWith('.html')) {
        mimeType = 'text/html'
      }
      return new NextResponse(fileBuffer as any, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
          'Content-Length': fileBuffer.length.toString()
        }
      })
    } catch (fileError) {
      console.error('Error reading file:', fileError)
      return NextResponse.json(
        { error: 'File not found or cannot be read' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
