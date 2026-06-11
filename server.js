const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const cron = require('node-cron')
const { getToken } = require('next-auth/jwt')
const { parse: parseCookieHeader } = require('cookie')
const { PrismaClient } = require('@prisma/client')

require('./scripts/validate-env.cjs').validateProductionEnv()

try {
  if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node')
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    })
  }
} catch (e) {
  if (process.env.SENTRY_DSN) {
    console.warn('[sentry] SENTRY_DSN set but @sentry/node is not installed')
  }
}

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)
const bindHost = process.env.HOST || '0.0.0.0'
const cronEnabled = process.env.DISABLE_IN_PROCESS_CRON !== 'true'
const prisma = new PrismaClient()

const app = next({ dev, hostname: 'localhost', port })
const handle = app.getRequestHandler()

async function setupRedisAdapter(io) {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return

  try {
    const { createAdapter } = require('@socket.io/redis-adapter')
    const { createClient } = require('redis')
    const pubClient = createClient({ url: redisUrl })
    const subClient = pubClient.duplicate()
    await Promise.all([pubClient.connect(), subClient.connect()])
    io.adapter(createAdapter(pubClient, subClient))
    console.log('✅ Socket.IO Redis adapter enabled')
  } catch (error) {
    console.error('⚠️ Redis adapter unavailable, using in-memory:', error.message)
  }
}

async function checkDeadlines() {
  try {
    const cronSecret = process.env.CRON_SECRET
    const url = new URL(`http://127.0.0.1:${port}/api/notifications/check-deadlines`)
    if (cronSecret) {
      url.searchParams.set('secret', cronSecret)
    }

    const headers = {}
    if (cronSecret) {
      headers['x-cron-secret'] = cronSecret
    }

    const response = await fetch(url.toString(), { method: 'POST', headers })
    const result = await response.json()
    console.log('📅 Проверка дедлайнов:', result)
  } catch (error) {
    console.error('❌ Ошибка проверки дедлайнов:', error.message)
  }
}

async function canAccessProject(userId, companyId, role, projectId) {
  if (!projectId || !userId) return false
  if (role === 'OWNER' || role === 'ADMIN') {
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    })
    return !!project
  }
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      companyId,
      OR: [{ creatorId: userId }, { users: { some: { userId } } }],
    },
    select: { id: true },
  })
  return !!project
}

app.prepare().then(async () => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/api/socket')) {
        return
      }
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  await setupRedisAdapter(io)
  global.io = io

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || ''
      const cookies = parseCookieHeader(cookieHeader)

      const token = await getToken({
        req: {
          headers: { cookie: cookieHeader },
          cookies,
        },
        secret: process.env.NEXTAUTH_SECRET,
      })
      if (!token?.sub) {
        return next(new Error('Unauthorized'))
      }
      socket.userId = token.sub
      socket.userRole = token.role
      socket.companyId = token.companyId
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`)
    }
    if (socket.companyId) {
      socket.join(`company:${socket.companyId}`)
    }

    socket.on('join-project', async (projectId) => {
      if (!projectId || typeof projectId !== 'string') return
      const allowed = await canAccessProject(
        socket.userId,
        socket.companyId,
        socket.userRole,
        projectId
      )
      if (allowed) {
        socket.join(`project:${projectId}`)
      }
    })

    socket.on('leave-project', (projectId) => {
      socket.leave(`project:${projectId}`)
    })

    socket.on('typing', (data) => {
      if (!data?.projectId) return
      socket.to(`project:${data.projectId}`).emit('user-typing', {
        userName: data.userName,
        isTyping: data.isTyping,
      })
    })

    socket.on('join-user', (userId) => {
      if (userId === socket.userId) {
        socket.join(`user:${userId}`)
      }
    })

    socket.on('disconnect', () => {})
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, bindHost, () => {
      console.log(`
  ✅ Next.js сервер запущен на http://${bindHost}:${port}
  🔌 Socket.IO: ws://${bindHost}:${port}/api/socket
      `)

      if (cronEnabled) {
        cron.schedule('0 9 * * *', () => {
          console.log('⏰ Запуск ежедневной проверки дедлайнов...')
          checkDeadlines()
        })

        setTimeout(() => {
          console.log('🚀 Первоначальная проверка дедлайнов...')
          checkDeadlines()
        }, 30000)

        console.log('  📅 Cron: проверка дедлайнов каждый день в 9:00')
      } else {
        console.log('  📅 In-process cron отключён (DISABLE_IN_PROCESS_CRON=true)')
      }
    })
})
