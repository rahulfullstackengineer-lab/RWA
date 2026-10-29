const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
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
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Attach io to global for API route access
  global.__io = io

  io.on('connection', (socket) => {
    // Join organization broadcast room
    socket.on('join-org', (orgId) => {
      if (orgId) {
        socket.join(`org:${orgId}`)
      }
    })

    // Join specific user room for targeted notifications
    socket.on('join-user', (userId) => {
      if (userId) {
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
