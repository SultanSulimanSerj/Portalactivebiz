import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем документ из базы данных
    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        creator: {
          companyId: user.companyId
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Читаем файл
    const uploadsDir = join(process.cwd(), 'uploads')
    const filePath = join(uploadsDir, document.filePath)
    
    try {
      const fileBuffer = await readFile(filePath)
      
      // Определяем MIME-тип на основе расширения файла
      let mimeType = document.mimeType
      if (document.filePath.endsWith('.docx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      } else if (document.filePath.endsWith('.pdf')) {
        mimeType = 'application/pdf'
      } else if (document.filePath.endsWith('.html')) {
        mimeType = 'text/html'
      }

      // Возвращаем файл для скачивания
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
