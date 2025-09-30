import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { getSignedUrl } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем документ
    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        // Проверяем, что документ принадлежит компании пользователя
        creator: {
          companyId: user.companyId
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Генерируем подписанный URL для скачивания из MinIO
    const downloadUrl = await getSignedUrl(document.filePath, 3600) // URL действителен 1 час

    // Перенаправляем на подписанный URL
    return NextResponse.redirect(downloadUrl)
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
