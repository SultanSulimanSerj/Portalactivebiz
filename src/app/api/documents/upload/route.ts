import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/id-generator'
import { uploadFile } from '@/lib/storage'

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

    // Generate unique filename and MinIO storage key
    const docId = generateId()
    const fileExtension = file.name.split('.').pop() || 'bin'
    const uniqueFilename = `${docId}.${fileExtension}`
    const storageKey = `documents/${user.companyId}/${uniqueFilename}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await uploadFile(storageKey, buffer, file.type)

    // Generate document number
    const documentCount = await prisma.document.count()
    const documentNumber = `DOC-${String(documentCount + 1).padStart(6, '0')}`

    // Create document record
    const document = await prisma.document.create({
      data: {
        id: docId,
        title,
        description: description || null,
        fileName: file.name,
        filePath: storageKey,
        fileSize: file.size,
        mimeType: file.type,
        version: 1,
        documentNumber,
        creatorId: user.id,
        companyId: user.companyId || null,
        projectId: projectId || null,
        updatedAt: new Date()
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
