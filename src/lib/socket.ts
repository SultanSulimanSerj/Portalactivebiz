import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponse } from 'next'

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: HTTPServer & {
      io?: SocketIOServer
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

let io: SocketIOServer | undefined

export function initSocket(server: HTTPServer): SocketIOServer {
  if (!io) {
    console.log('🔌 Инициализация Socket.IO сервера...')
    
    io = new SocketIOServer(server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    })

    io.on('connection', (socket) => {
      console.log('✅ Клиент подключен:', socket.id)

      // Присоединение к комнате проекта
      socket.on('join-project', (projectId: string) => {
        socket.join(`project:${projectId}`)
        console.log(`📁 Клиент ${socket.id} присоединился к проекту ${projectId}`)
      })

      // Выход из комнаты проекта
      socket.on('leave-project', (projectId: string) => {
        socket.leave(`project:${projectId}`)
        console.log(`📁 Клиент ${socket.id} покинул проект ${projectId}`)
      })

      // Индикатор печати
      socket.on('typing', (data: { projectId: string; userName: string; isTyping: boolean }) => {
        socket.to(`project:${data.projectId}`).emit('user-typing', {
          userName: data.userName,
          isTyping: data.isTyping
        })
      })

      socket.on('disconnect', () => {
        console.log('❌ Клиент отключен:', socket.id)
      })
    })

    console.log('✅ Socket.IO сервер инициализирован')
  }

  return io
}

export function getIO(): SocketIOServer | undefined {
  return io
}

// Отправить новое сообщение всем участникам проекта
export function emitNewMessage(projectId: string, message: any) {
  if (io) {
    io.to(`project:${projectId}`).emit('new-message', message)
    console.log(`📨 Отправлено сообщение в проект ${projectId}`)
  }
}

// Отправить обновление проекта
export function emitProjectUpdate(projectId: string, data: any) {
  if (io) {
    io.to(`project:${projectId}`).emit('project-updated', data)
    console.log(`🔄 Отправлено обновление проекта ${projectId}`)
  }
}

// Отправить уведомление пользователю
export function emitNotification(userId: string, notification: any) {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification)
    console.log(`🔔 Отправлено уведомление пользователю ${userId}`)
  }
}

