import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { getSignedUrl } from '@/lib/storage'

// GET /api/approvals/[id]/attachments/[attachmentId]/download - Скачать файл
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: approvalId, attachmentId } = params

    // Доступ: создатель согласования или участник (assignee)
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        assignments: { select: { userId: true } }
      }
    })

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    const isCreator = approval.creatorId === user.id
    const isAssignee = approval.assignments.some(a => a.userId === user.id)
    if (!isCreator && !isAssignee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Получаем информацию о файле
    const attachment = await prisma.approvalAttachment.findFirst({
      where: {
        id: attachmentId,
        approvalId: approvalId
      }
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    try {
      // Получаем подписанный URL для скачивания файла
      const downloadUrl = await getSignedUrl(attachment.filePath, 3600) // 1 час
      
      // Перенаправляем на URL для скачивания
      return NextResponse.redirect(downloadUrl)
    } catch (storageError) {
      console.error('Error generating download URL:', storageError)
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

  } catch (error) {
    console.error('Error downloading attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
