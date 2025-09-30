import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/storage'

// GET /api/approvals/[id]/attachments - Получить все вложения согласования
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachments = await prisma.approvalAttachment.findMany({
      where: {
        approvalId: params.id
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error('Error fetching approval attachments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/approvals/[id]/attachments - Загрузить вложение к согласованию
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Загружаем файл в хранилище
    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = `approvals/${params.id}/${Date.now()}-${file.name}`
    
    await uploadFile(filePath, buffer, file.type)

    // Сохраняем информацию о вложении в БД
    const attachment = await prisma.approvalAttachment.create({
      data: {
        fileName: file.name,
        filePath,
        fileSize: file.size,
        mimeType: file.type,
        approvalId: params.id,
        uploadedById: user.id
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Добавляем запись в историю
    await prisma.approvalHistory.create({
      data: {
        action: 'file_attached',
        changes: {
          fileName: file.name,
          fileSize: file.size
        },
        approvalId: params.id,
        userId: user.id
      }
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Error uploading approval attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
