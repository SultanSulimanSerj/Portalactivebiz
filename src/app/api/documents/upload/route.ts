import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { saveOptimizedImage, getImageUrl } from '@/lib/image-optimization'
import { getCDNUrl } from '@/lib/cdn'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const projectId = formData.get('projectId') as string
    const category = formData.get('category') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${uuidv4()}.${fileExtension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Check if file is an image
    const isImage = file.type.startsWith('image/')
    
    let filePath: string
    let optimizedPath: string | null = null
    let thumbnailPath: string | null = null

    if (isImage) {
      // Optimize image
      const result = await saveOptimizedImage(file, uploadsDir, uniqueFilename, {
        width: 1200,
        height: 800,
        quality: 85,
        format: 'webp'
      })
      filePath = result.originalPath
      optimizedPath = result.optimizedPath
      thumbnailPath = result.thumbnailPath
    } else {
      // Save regular file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      filePath = join(uploadsDir, uniqueFilename)
      await writeFile(filePath, buffer)
    }

    // Generate document number
    const documentCount = await prisma.document.count()
    const documentNumber = `DOC-${String(documentCount + 1).padStart(6, '0')}`

    // Create document record
    const document = await prisma.document.create({
      data: {
        title,
        description: description || null,
        fileName: file.name,
        filePath: uniqueFilename,
        fileSize: file.size,
        mimeType: file.type,
        version: 1,
        documentNumber,
        creatorId: user.id,
        projectId: projectId || null,
        // Store optimization metadata
        ...(isImage && {
          metadata: {
            optimizedPath,
            thumbnailPath,
            isImage: true,
            cdnUrl: getCDNUrl(uniqueFilename)
          }
        })
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
