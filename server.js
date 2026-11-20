const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

async function ensureOrganizationColumns() {
  const dbUrl = process.env.DATABASE_URL || ''
  if (!dbUrl.startsWith('postgres')) return
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  const statements = [
    'ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "registeringAuthority" TEXT',
    'ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "housingType" TEXT',
    'ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "adminDesignation" TEXT',
  ]
  try {
    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql)
    }
  } catch (err) {
    console.error('Could not add missing organization columns:', err && err.message ? err.message : err)
  } finally {
    await prisma.$disconnect()
  }
}

app.prepare().then(async () => {
  await ensureOrganizationColumns()
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      if (!res.headersSent) {
        res.statusCode = 500
        res.end('Internal Server Error')
      }
    }
  })

  const io = new Server(server, {
    path: '/api/socket/io',
    // Leave Next.js hot-reload upgrades alone. Destroying them leaves the dev page blank.
    destroyUpgrade: false,
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Attach io to global for API route access
  global.__io = io

  function audienceRoom(role) {
    if (role === 'STAFF' || role === 'staff') return 'staff'
    const admins = ['RWA_ADMIN', 'ADMIN', 'TREASURER', 'SECRETARY', 'PRESIDENT', 'COMMITTEE_MEMBER', 'MANAGER', 'admin']
    if (admins.includes(role)) return 'admin'
    return 'resident'
  }

  io.on('connection', (socket) => {
    // Join organization broadcast room and the caller's role room
    socket.on('join-org', (payload) => {
      const orgId = typeof payload === 'string' ? payload : payload && payload.orgId
      const role = typeof payload === 'object' && payload ? payload.role : null
      if (!orgId || orgId === 'greenfield-rwa') return
      socket.join(`org:${orgId}`)
      if (role) socket.join(`org:${orgId}:${audienceRoom(role)}`)
    })

    // Join specific user room for targeted notifications
    socket.on('join-user', (userId) => {
      if (userId && userId !== 'resident-1') {
        socket.join(`user:${userId}`)
      }
    })

    // Society-wide broadcast event
    socket.on('broadcast-notice', (data) => {
      if (data?.orgId) {
        io.to(`org:${data.orgId}`).emit('new-notice', data)
      }
    })

    // Complaint status updates
    socket.on('complaint-updated', (data) => {
      if (data?.orgId) {
        io.to(`org:${data.orgId}`).emit('complaint-updated', data)
      }
      if (data?.userId) {
        io.to(`user:${data.userId}`).emit('complaint-updated', data)
      }
    })
  })

  server.listen(port, hostname, (err) => {
    if (err) throw err
    console.log(`> 🚀 RWA SaaS Server ready with WebSockets on http://${hostname}:${port} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`)
  })

  // Graceful shutdown
  const shutdown = () => {
    console.log('> Shutting down server gracefully...')
    server.close(() => {
      console.log('> HTTP and Socket.IO server closed.')
      process.exit(0)
    })
    setTimeout(() => {
      console.error('> Forced shutdown due to timeout')
      process.exit(1)
    }, 10000)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
})
