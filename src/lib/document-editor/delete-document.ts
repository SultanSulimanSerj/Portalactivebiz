import * as fs from 'fs/promises'
import * as path from 'path'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/storage'
import {
  getDocumentExportQueue,
  isExportQueueConfigured,
} from '@/lib/document-export/queue'

const PLACEHOLDER_FILE = 'draft-placeholder.txt'

function isMinIOKey(filePath: string): boolean {
  return (
    filePath.startsWith('documents/') ||
    filePath.startsWith('stages/') ||
    filePath.startsWith('approvals/')
  )
}

function isDeletablePath(filePath: string | null | undefined): filePath is string {
  return Boolean(filePath && filePath !== PLACEHOLDER_FILE)
}

async function deleteStoredFile(filePath: string): Promise<void> {
  if (isMinIOKey(filePath)) {
    await deleteFile(filePath)
    return
  }
  const uploadsDir = path.join(process.cwd(), 'uploads')
  await fs.unlink(path.join(uploadsDir, filePath))
}

async function cancelPendingExportJobs(documentId: string): Promise<void> {
  const pendingJobs = await prisma.documentExportJob.findMany({
    where: {
      documentId,
      status: { in: ['QUEUED', 'PROCESSING'] },
    },
    select: { id: true, bullJobId: true },
  })

  if (pendingJobs.length === 0) return

  if (isExportQueueConfigured()) {
    const queue = getDocumentExportQueue()
    for (const job of pendingJobs) {
      const bullJobId = job.bullJobId ?? `doc-export-${job.id}`
      try {
        await queue.remove(bullJobId)
      } catch (err) {
        console.warn('Could not remove export job from queue:', bullJobId, err)
      }
    }
  }

  await prisma.documentExportJob.updateMany({
    where: { id: { in: pendingJobs.map((j) => j.id) } },
    data: {
      status: 'FAILED',
      completedAt: new Date(),
      errorMessage: 'Документ удалён',
    },
  })
}

function collectDocumentFilePaths(document: {
  filePath: string
  pdfFilePath: string | null
  edoXmlPath: string | null
  versions: Array<{ filePath: string; pdfFilePath: string | null }>
  approvals: Array<{ attachments: Array<{ filePath: string }> }>
}): string[] {
  const filePaths = new Set<string>()
  if (isDeletablePath(document.filePath)) filePaths.add(document.filePath)
  if (isDeletablePath(document.pdfFilePath)) filePaths.add(document.pdfFilePath)
  if (isDeletablePath(document.edoXmlPath)) filePaths.add(document.edoXmlPath)
  for (const version of document.versions) {
    if (isDeletablePath(version.filePath)) filePaths.add(version.filePath)
    if (isDeletablePath(version.pdfFilePath)) filePaths.add(version.pdfFilePath)
  }
  for (const approval of document.approvals) {
    for (const attachment of approval.attachments) {
      if (isDeletablePath(attachment.filePath)) filePaths.add(attachment.filePath)
    }
  }
  return Array.from(filePaths)
}

export async function deleteDocumentForCompany(
  documentId: string,
  companyId: string
): Promise<boolean> {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      OR: [{ companyId }, { companyId: null, creator: { companyId } }],
    },
    include: {
      versions: true,
      approvals: {
        include: { attachments: true },
      },
    },
  })

  if (!document) return false

  const filePaths = collectDocumentFilePaths(document)
  const approvalIds = document.approvals.map((approval) => approval.id)

  await cancelPendingExportJobs(documentId)

  await prisma.$transaction(async (tx) => {
    if (approvalIds.length > 0) {
      await tx.approvalAssignment.deleteMany({
        where: { approvalId: { in: approvalIds } },
      })
      await tx.approvalComment.deleteMany({
        where: { approvalId: { in: approvalIds } },
      })
      await tx.approvalAttachment.deleteMany({
        where: { approvalId: { in: approvalIds } },
      })
      await tx.approvalHistory.deleteMany({
        where: { approvalId: { in: approvalIds } },
      })
      await tx.approval.deleteMany({
        where: { id: { in: approvalIds } },
      })
    }

    await tx.documentVersion.deleteMany({ where: { documentId } })
    await tx.document.delete({ where: { id: documentId } })
  })

  const deleteErrors: string[] = []
  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        await deleteStoredFile(filePath)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('Error deleting stored file:', filePath, err)
        deleteErrors.push(`${filePath}: ${message}`)
      }
    })
  )

  if (deleteErrors.length > 0) {
    throw new Error(
      `Документ удалён из базы, но не все файлы удалены из хранилища (${deleteErrors.length})`
    )
  }

  return true
}
