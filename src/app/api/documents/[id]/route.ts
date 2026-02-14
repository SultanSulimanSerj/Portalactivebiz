import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import * as fs from 'fs/promises'
import * as path from 'path'
import { deleteFile } from '@/lib/storage'

function isMinIOKey(filePath: string): boolean {
  return filePath.startsWith('documents/') || filePath.startsWith('stages/') || filePath.startsWith('approvals/')
}

export async function DELETE(
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
      try {
        await deleteFile(document.filePath)
      } catch (fileError) {
        console.error('Error deleting file from MinIO:', fileError)
      }
    } else {
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads')
        const filePath = path.join(uploadsDir, document.filePath)
        await fs.unlink(filePath)
      } catch (fileError) {
        console.error('Error deleting file:', fileError)
      }
    }

    await prisma.document.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
