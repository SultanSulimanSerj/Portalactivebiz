import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import * as fs from 'fs/promises'
import * as path from 'path'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get document to find file path
    const document = await prisma.document.findUnique({
      where: { id: params.id }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from filesystem
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads')
      const filePath = path.join(uploadsDir, document.filePath)
      await fs.unlink(filePath)
    } catch (fileError) {
      console.error('Error deleting file:', fileError)
      // Continue even if file deletion fails
    }

    // Delete document from database
    await prisma.document.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
