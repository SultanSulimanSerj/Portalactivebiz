import { prisma } from '@/lib/prisma'

export interface CreateNotificationData {
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  projectId?: string
}

export async function createNotification(data: CreateNotificationData) {
  return await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      projectId: data.projectId
    }
  })
}

export async function createProjectNotification(
  projectId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  // Получаем всех участников проекта
  const projectUsers = await prisma.projectUser.findMany({
    where: { projectId },
    include: { user: true }
  })

  // Создаем уведомления для всех участников
  const notifications = await Promise.all(
    projectUsers.map(user => 
      prisma.notification.create({
        data: {
          userId: user.userId,
          title,
          message,
          type,
          projectId
        }
      })
    )
  )

  return notifications
}

export async function createSystemNotification(
  companyId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  // Получаем всех пользователей компании
  const users = await prisma.user.findMany({
    where: { companyId }
  })

  // Создаем уведомления для всех пользователей
  const notifications = await Promise.all(
    users.map(user => 
      prisma.notification.create({
        data: {
          userId: user.id,
          title,
          message,
          type
        }
      })
    )
  )

  return notifications
}

// Уведомления для задач
export async function notifyTaskAssignment(
  taskId: string,
  assigneeIds: string[],
  taskTitle: string,
  projectName?: string
) {
  const projectId = projectName ? await getProjectIdByName(projectName) : undefined
  
  const notifications = await Promise.all(
    assigneeIds.map(assigneeId => 
      prisma.notification.create({
        data: {
          userId: assigneeId,
          title: 'Новая задача назначена',
          message: `Вам назначена задача: "${taskTitle}"${projectName ? ` в проекте "${projectName}"` : ''}`,
          type: 'INFO',
          projectId,
          actionType: 'task',
          actionId: taskId
        }
      })
    )
  )
  return notifications
}

export async function notifyTaskUpdate(
  taskId: string,
  assigneeIds: string[],
  taskTitle: string,
  updateType: 'status' | 'priority' | 'dueDate' | 'description',
  projectName?: string
) {
  const updateMessages = {
    status: 'изменен статус',
    priority: 'изменен приоритет', 
    dueDate: 'изменен срок выполнения',
    description: 'обновлено описание'
  }

  const projectId = projectName ? await getProjectIdByName(projectName) : undefined

  const notifications = await Promise.all(
    assigneeIds.map(assigneeId => 
      prisma.notification.create({
        data: {
          userId: assigneeId,
          title: 'Задача обновлена',
          message: `У задачи "${taskTitle}" ${updateMessages[updateType]}${projectName ? ` в проекте "${projectName}"` : ''}`,
          type: 'INFO',
          projectId,
          actionType: 'task',
          actionId: taskId
        }
      })
    )
  )
  return notifications
}

// Уведомления для согласований
export async function notifyNewApproval(
  approvalId: string,
  assigneeIds: string[],
  approvalTitle: string,
  projectName?: string
) {
  const projectId = projectName ? await getProjectIdByName(projectName) : undefined
  
  const notifications = await Promise.all(
    assigneeIds.map(assigneeId => 
      prisma.notification.create({
        data: {
          userId: assigneeId,
          title: 'Требуется согласование',
          message: `Вам назначено согласование: "${approvalTitle}"${projectName ? ` в проекте "${projectName}"` : ''}`,
          type: 'WARNING',
          projectId,
          actionType: 'approval',
          actionId: approvalId
        }
      })
    )
  )
  return notifications
}

export async function notifyApprovalResponse(
  approvalId: string,
  creatorId: string,
  responderName: string,
  response: 'approved' | 'rejected',
  approvalTitle: string,
  projectName?: string
) {
  const responseMessages = {
    approved: 'согласовал',
    rejected: 'отклонил'
  }

  const projectId = projectName ? await getProjectIdByName(projectName) : undefined

  return await prisma.notification.create({
    data: {
      userId: creatorId,
      title: response === 'approved' ? 'Согласование одобрено' : 'Согласование отклонено',
      message: `${responderName} ${responseMessages[response]} согласование "${approvalTitle}"${projectName ? ` в проекте "${projectName}"` : ''}`,
      type: response === 'approved' ? 'SUCCESS' : 'ERROR',
      projectId,
      actionType: 'approval',
      actionId: approvalId
    }
  })
}

// Уведомления для чата
export async function notifyChatMention(
  messageId: string,
  mentionedUserIds: string[],
  senderName: string,
  messagePreview: string,
  projectName?: string
) {
  const projectId = projectName ? await getProjectIdByName(projectName) : undefined
  
  const notifications = await Promise.all(
    mentionedUserIds.map(userId => 
      prisma.notification.create({
        data: {
          userId,
          title: 'Вас упомянули в чате',
          message: `${senderName} упомянул вас в сообщении: "${messagePreview.substring(0, 50)}..."${projectName ? ` в проекте "${projectName}"` : ''}`,
          type: 'INFO',
          projectId
        }
      })
    )
  )
  return notifications
}

export async function notifyProjectUpdate(
  projectId: string,
  participantIds: string[],
  updateType: 'status' | 'budget' | 'timeline' | 'team',
  projectName: string,
  details?: string
) {
  const updateMessages = {
    status: 'изменен статус',
    budget: 'изменен бюджет',
    timeline: 'изменены сроки',
    team: 'изменен состав команды'
  }

  const notifications = await Promise.all(
    participantIds.map(participantId => 
      prisma.notification.create({
        data: {
          userId: participantId,
          title: 'Проект обновлен',
          message: `В проекте "${projectName}" ${updateMessages[updateType]}${details ? `: ${details}` : ''}`,
          type: 'INFO',
          projectId,
          actionType: 'project',
          actionId: projectId
        }
      })
    )
  )
  return notifications
}

// Уведомления для документов
export async function notifyDocumentUpload(
  documentId: string,
  projectId: string,
  participantIds: string[],
  documentName: string,
  projectName: string,
  uploaderName: string
) {
  const notifications = await Promise.all(
    participantIds.map(participantId => 
      prisma.notification.create({
        data: {
          userId: participantId,
          title: 'Новый документ',
          message: `${uploaderName} загрузил документ "${documentName}" в проект "${projectName}"`,
          type: 'INFO',
          projectId,
          actionType: 'document',
          actionId: documentId
        }
      })
    )
  )
  return notifications
}

// Уведомления для финансов
export async function notifyFinancialUpdate(
  projectId: string,
  participantIds: string[],
  updateType: 'income' | 'expense' | 'budget',
  amount: number,
  projectName: string,
  details?: string
) {
  const updateMessages = {
    income: 'добавлен доход',
    expense: 'добавлен расход', 
    budget: 'изменен бюджет'
  }

  const notifications = await Promise.all(
    participantIds.map(participantId => 
      prisma.notification.create({
        data: {
          userId: participantId,
          title: 'Финансовые изменения',
          message: `В проекте "${projectName}" ${updateMessages[updateType]} на сумму ${amount.toLocaleString('ru-RU')} ₽${details ? `: ${details}` : ''}`,
          type: 'INFO',
          projectId,
          actionType: 'finance',
          actionId: projectId
        }
      })
    )
  )
  return notifications
}

export async function notifyApprovalCompleted(
  approvalId: string,
  participantIds: string[],
  approvalTitle: string,
  projectName?: string
) {
  const projectId = projectName ? await getProjectIdByName(projectName) : undefined
  
  const notifications = await Promise.all(
    participantIds.map(participantId => 
      prisma.notification.create({
        data: {
          userId: participantId,
          title: 'Согласование завершено',
          message: `Согласование "${approvalTitle}" завершено${projectName ? ` в проекте "${projectName}"` : ''}`,
          type: 'SUCCESS',
          projectId,
          actionType: 'approval',
          actionId: approvalId
        }
      })
    )
  )
  return notifications
}

// Вспомогательная функция для получения ID проекта по имени
async function getProjectIdByName(projectName: string): Promise<string | undefined> {
  const project = await prisma.project.findFirst({
    where: { name: projectName },
    select: { id: true }
  })
  return project?.id
}