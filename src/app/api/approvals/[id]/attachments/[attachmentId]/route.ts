import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/storage'

// DELETE /api/approvals/[id]/attachments/[attachmentId] - Удалить вложение
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем вложение
    const attachment = await prisma.approvalAttachment.findUnique({
      where: { id: params.attachmentId },
      include: { approval: true }
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Проверяем права доступа
    if (attachment.approval.creatorId !== user.id && 
        !attachment.approval.assignments.some(a => a.userId === user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Удаляем файл из хранилища
    try {
      await deleteFile(attachment.filePath)
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Продолжаем удаление из БД даже если файл не найден в хранилище
    }

    // Удаляем запись из БД
    await prisma.approvalAttachment.delete({
      where: { id: params.attachmentId }
    })

    // Добавляем запись в историю
    await prisma.approvalHistory.create({
      data: {
        action: 'file_deleted',
        changes: {
          fileName: attachment.fileName,
          fileSize: attachment.fileSize
        },
        approvalId: params.id,
        userId: user.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting approval attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
