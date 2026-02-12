const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const cron = require('node-cron')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Функция для проверки дедлайнов
async function checkDeadlines() {
  try {
    const response = await fetch(`http://${hostname}:${port}/api/notifications/check-deadlines`, {
      method: 'POST'
    })
    const result = await response.json()
    console.log('📅 Проверка дедлайнов:', result)
  } catch (error) {
    console.error('❌ Ошибка проверки дедлайнов:', error.message)
  }
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Инициализация Socket.IO
  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  // Сохраняем io в глобальной переменной для доступа из API routes
  global.io = io

  io.on('connection', (socket) => {
    console.log('✅ Клиент подключен:', socket.id)

    // Присоединение к комнате проекта
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`)
      console.log(`📁 Клиент ${socket.id} присоединился к проекту ${projectId}`)
    })

    // Выход из комнаты проекта
    socket.on('leave-project', (projectId) => {
      socket.leave(`project:${projectId}`)
      console.log(`📁 Клиент ${socket.id} покинул проект ${projectId}`)
    })

    // Индикатор печати
    socket.on('typing', (data) => {
      socket.to(`project:${data.projectId}`).emit('user-typing', {
        userName: data.userName,
        isTyping: data.isTyping
      })
    })

    // Присоединение к комнате пользователя для личных уведомлений
    socket.on('join-user', (userId) => {
      socket.join(`user:${userId}`)
      console.log(`👤 Клиент ${socket.id} присоединился к комнате пользователя ${userId}`)
    })

    socket.on('disconnect', () => {
      console.log('❌ Клиент отключен:', socket.id)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`
  ✅ Next.js сервер запущен на http://${hostname}:${port}
  🔌 Socket.IO доступен на ws://${hostname}:${port}/api/socket
      `)

      // Запускаем cron-задачу для проверки дедлайнов
      // Каждый день в 9:00 утра
      cron.schedule('0 9 * * *', () => {
        console.log('⏰ Запуск ежедневной проверки дедлайнов...')
        checkDeadlines()
      })

      // Также проверяем через 30 секунд после запуска сервера
      setTimeout(() => {
        console.log('🚀 Первоначальная проверка дедлайнов...')
        checkDeadlines()
      }, 30000)

      console.log('  📅 Cron-задача настроена: проверка дедлайнов каждый день в 9:00')
    })
})

