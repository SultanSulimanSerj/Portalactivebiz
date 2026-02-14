import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth-api'
import { generateContractDocument, ContractData } from '@/lib/document-generator'
import { Packer } from 'docx'
import path from 'path'
import { uploadFile } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, documentType, estimateId } = body

    if (!projectId || !documentType) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      )
    }

    // Получаем данные проекта с полной информацией
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: true,
        creator: true,
        estimates: {
          where: estimateId ? { id: estimateId } : {},
          include: {
            items: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 })
    }

    // Проверяем доступ
    if (project.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    // Получаем смету (если указана)
    const estimate = estimateId 
      ? project.estimates?.find((e: any) => e.id === estimateId)
      : project.estimates && project.estimates.length > 0 
        ? project.estimates[0] 
        : null

    // Формируем данные для договора
    const today = new Date()
    const contractNumber = `DOG-${Date.now()}`
    
    const contractData: ContractData = {
      contractNumber,
      contractDate: today.toLocaleDateString('ru-RU'),
      city: project.company?.city || 'Екатеринбург',
      
      // Исполнитель (наша компания)
      executorName: project.company?.name || '',
      executorLegalName: project.company?.legalName || project.company?.name || '',
      executorDirector: project.company?.directorName || '',
      executorDirectorPosition: project.company?.directorPosition || 'Генеральный директор',
      executorInn: project.company?.inn || '',
      executorOgrn: project.company?.ogrn || '',
      executorAddress: project.company?.legalAddress || project.company?.address || '',
      executorPhone: project.company?.phone || project.company?.contactPhone || '',
      executorEmail: project.company?.contactEmail || '',
      executorBankAccount: project.company?.bankAccount || '',
      executorBankName: project.company?.bankName || '',
      executorBankBik: project.company?.bankBik || '',
      executorCorrespondentAccount: project.company?.correspondentAccount || '',
      
      // Заказчик (клиент)
      clientName: project.clientName || '',
      clientLegalName: project.clientLegalName || project.clientName || '',
      clientDirector: project.clientDirectorName || '',
      clientInn: project.clientInn || '',
      clientKpp: project.clientKpp || '',
      clientOgrn: project.clientOgrn || '',
      clientLegalAddress: project.clientLegalAddress || '',
      clientPhone: project.clientContactPhone || '',
      clientEmail: project.clientContactEmail || '',
      clientBankAccount: project.clientBankAccount || '',
      clientBankName: project.clientBankName || '',
      clientBankBik: project.clientBankBik || '',
      clientCorrespondentAccount: project.clientCorrespondentAccount || '',
      
      // Данные проекта
      projectName: project.name,
      projectDescription: project.description || '',
      workAddress: project.clientActualAddress || project.clientLegalAddress || '',
      startDate: project.startDate ? new Date(project.startDate).toLocaleDateString('ru-RU') : '',
      endDate: project.endDate ? new Date(project.endDate).toLocaleDateString('ru-RU') : '',
      totalAmount: estimate 
        ? Number(estimate.totalWithVat || estimate.total).toLocaleString('ru-RU') 
        : (project.budget ? Number(project.budget).toLocaleString('ru-RU') : ''),
      vatEnabled: estimate ? estimate.vatEnabled : false
    }

    // Генерируем документ
    let doc
    switch (documentType) {
      case 'contract':
        doc = generateContractDocument(contractData)
        break
      default:
        return NextResponse.json(
          { error: 'Неподдерживаемый тип документа' },
          { status: 400 }
        )
    }

    // Конвертируем в Buffer
    const buffer = await Packer.toBuffer(doc)

    // Формируем имена файлов и ключ в MinIO
    const timestamp = Date.now()
    const documentTypeLabel = documentType === 'contract' ? 'Договор_подряда' : documentType
    const fileName = `${documentTypeLabel}_${timestamp}.docx`
    const uniqueFileName = `${timestamp}_${fileName}`
    const storageKey = `documents/${user.companyId}/${uniqueFileName}`

    // Загружаем файл в MinIO
    await uploadFile(storageKey, Buffer.from(buffer), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

    // Создаем запись в базе данных
    console.log('📝 Создание документа с данными:', {
      projectId,
      title: fileName.replace('.docx', ''),
      creatorId: user.id
    })

    const document = await prisma.document.create({
      data: {
        title: fileName.replace('.docx', ''),
        description: `Автоматически сгенерированный документ: ${documentTypeLabel}`,
        fileName: fileName,
        filePath: storageKey,
        fileSize: buffer.length,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        category: 'CONTRACT',
        documentNumber: contractNumber,
        isPublished: true,
        publishedAt: new Date(),
        projectId: projectId,
        creatorId: user.id,
        companyId: user.companyId || null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`✅ Документ сохранен:`, {
      id: document.id,
      projectId: document.projectId,
      projectName: document.project?.name
    })

    // Возвращаем файл для скачивания
    return new NextResponse(Buffer.from(buffer) as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': buffer.length.toString(),
        'X-Document-Id': document.id // Передаем ID документа в заголовке
      }
    })
  } catch (error) {
    console.error('Error generating document:', error)
    return NextResponse.json(
      { error: 'Ошибка при генерации документа', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

