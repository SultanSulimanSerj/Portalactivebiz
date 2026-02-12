import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/id-generator'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'stages')

// GET - получить фото этапа
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stageId } = params

    // Проверяем доступ к этапу
    const stage = await prisma.workStage.findFirst({
      where: {
        id: stageId,
        project: {
          companyId: user.companyId
        }
      }
    })

    if (!stage) {
      return NextResponse.json({ error: 'Этап не найден' }, { status: 404 })
    }

    // Получаем фото
    const photos = await prisma.stagePhoto.findMany({
      where: { stageId },
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Добавляем URL к каждому фото
    const photosWithUrls = photos.map(photo => ({
      ...photo,
      url: `/uploads/stages/${photo.filename}`
    }))

    return NextResponse.json(photosWithUrls)
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json({ error: 'Ошибка получения фото' }, { status: 500 })
  }
}

// POST - загрузить фото
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stageId } = params

    // Проверяем доступ к этапу
    const stage = await prisma.workStage.findFirst({
      where: {
        id: stageId,
        project: {
          companyId: user.companyId
        }
      }
    })

    if (!stage) {
      return NextResponse.json({ error: 'Этап не найден' }, { status: 404 })
    }

    // Получаем файл из формы
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 })
    }

    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Недопустимый тип файла. Разрешены: JPG, PNG, GIF, WebP' }, { status: 400 })
    }

    // Проверяем размер (макс 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Файл слишком большой. Максимум 10 МБ' }, { status: 400 })
    }

    // Создаём уникальное имя файла
    const ext = path.extname(file.name) || '.jpg'
    const filename = `${stageId}_${Date.now()}_${generateId()}${ext}`

    // Убеждаемся, что директория существует
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Сохраняем файл
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(path.join(UPLOAD_DIR, filename), buffer)

    // Создаём запись в БД
    const photo = await prisma.stagePhoto.create({
      data: {
        id: generateId(),
        filename,
        originalName: file.name,
        description: description || null,
        mimeType: file.type,
        size: file.size,
        stageId,
        uploadedById: user.id
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({
      ...photo,
      url: `/uploads/stages/${filename}`
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json({ error: 'Ошибка загрузки фото' }, { status: 500 })
  }
}

// DELETE - удалить фото
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stageId } = params
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json({ error: 'ID фото обязателен' }, { status: 400 })
    }

    // Проверяем доступ
    const photo = await prisma.stagePhoto.findFirst({
      where: {
        id: photoId,
        stageId,
        stage: {
          project: {
            companyId: user.companyId
          }
        }
      }
    })

    if (!photo) {
      return NextResponse.json({ error: 'Фото не найдено' }, { status: 404 })
    }

    // Удаляем файл с диска
    try {
      await unlink(path.join(UPLOAD_DIR, photo.filename))
    } catch (e) {
      console.error('Error deleting file:', e)
      // Продолжаем удаление из БД даже если файл не найден
    }

    // Удаляем запись из БД
    await prisma.stagePhoto.delete({
      where: { id: photoId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json({ error: 'Ошибка удаления фото' }, { status: 500 })
  }
}
