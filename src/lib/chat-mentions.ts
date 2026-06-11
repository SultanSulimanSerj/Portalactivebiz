import { prisma } from '@/lib/prisma'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function resolveMentionedUsers(
  content: string,
  companyId: string | null | undefined,
  excludeUserId: string,
  extraNames?: string[]
) {
  if (!companyId) return []

  const users = await prisma.user.findMany({
    where: { companyId, id: { not: excludeUserId } },
    select: { id: true, name: true },
  })

  const sorted = [...users].sort(
    (a, b) => (b.name?.length ?? 0) - (a.name?.length ?? 0)
  )
  const mentioned = new Map<string, { id: string; name: string }>()

  for (const user of sorted) {
    if (!user.name) continue
    const pattern = new RegExp(`@${escapeRegExp(user.name)}(?=\\s|$|[.,!?;:])`, 'u')
    if (pattern.test(content)) {
      mentioned.set(user.id, { id: user.id, name: user.name })
    }
  }

  if (extraNames?.length) {
    for (const user of users) {
      if (user.name && extraNames.includes(user.name)) {
        mentioned.set(user.id, { id: user.id, name: user.name })
      }
    }
  }

  return Array.from(mentioned.values())
}

export async function notifyChatMentions(options: {
  content: string
  senderId: string
  senderName: string
  companyId: string | null | undefined
  projectId?: string | null
  projectName?: string | null
  messageId?: string
  mentionNames?: string[]
}) {
  const mentionedUsers = await resolveMentionedUsers(
    options.content,
    options.companyId,
    options.senderId,
    options.mentionNames
  )

  if (mentionedUsers.length === 0) return []

  const preview =
    options.content.length > 50
      ? `${options.content.substring(0, 50)}...`
      : options.content
  const projectPart = options.projectName ? ` в проекте "${options.projectName}"` : ''

  const notifications = await Promise.all(
    mentionedUsers.map((mentionedUser) =>
      prisma.notification.create({
        data: {
          userId: mentionedUser.id,
          title: 'Вас упомянули в чате',
          message: `${options.senderName} упомянул вас${projectPart}: ${preview}`,
          type: 'INFO',
          projectId: options.projectId || null,
          actionType: options.projectId ? 'project' : 'chat',
          actionId: options.projectId || options.messageId || null,
          companyId: options.companyId || null,
        },
      })
    )
  )

  try {
    const io = (global as { io?: { to: (room: string) => { emit: (event: string, data: unknown) => void } } }).io
    if (io) {
      for (const notification of notifications) {
        io.to(`user:${notification.userId}`).emit('notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type.toLowerCase(),
          isRead: notification.isRead,
          createdAt: notification.createdAt.toISOString(),
          projectId: notification.projectId,
          actionType: notification.actionType,
          actionId: notification.actionId,
        })
      }
    }
  } catch (error) {
    console.error('Ошибка отправки уведомлений об упоминании через WebSocket:', error)
  }

  return notifications
}
