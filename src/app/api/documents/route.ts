import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where = {
      ...(projectId && { projectId }),
      creator: {
        id: user.id
      }
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true }
        },
        template: {
          select: { id: true, name: true }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.document.count({ where })

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, fileName, filePath, fileSize, mimeType, projectId, templateId } = body

    // Generate document number if needed
    const numberingRule = await prisma.numberingRule.findFirst({
      where: {
        companyId: user.companyId,
        isActive: true
      }
    })

    let documentNumber = null
    if (numberingRule) {
      const counter = numberingRule.counter + 1
      documentNumber = numberingRule.pattern.replace('{counter}', counter.toString().padStart(3, '0'))
      
      await prisma.numberingRule.update({
        where: { id: numberingRule.id },
        data: { counter }
      })
    }

    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileName,
        filePath,
        fileSize: parseInt(fileSize),
        mimeType,
        documentNumber,
        projectId: projectId || null,
        creatorId: user.id,
        templateId: templateId || null
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
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
