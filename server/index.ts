import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ['GET', 'POST']
  }
})

const prisma = new PrismaClient()
const PORT = process.env.SOCKET_PORT || 3001

// Middleware
app.use(express.json())

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Join a session room
  socket.on('join-session', (sessionId: string) => {
    socket.join(`session-${sessionId}`)
    console.log(`Socket ${socket.id} joined session: ${sessionId}`)
  })

  // Leave a session room
  socket.on('leave-session', (sessionId: string) => {
    socket.leave(`session-${sessionId}`)
    console.log(`Socket ${socket.id} left session: ${sessionId}`)
  })

  // Broadcast number called
  socket.on('number-called', (data: {
    sessionId: string
    gameId: string
    number: number
    display: string
    callCount: number
  }) => {
    console.log('Number called:', data)
    io.to(`session-${data.sessionId}`).emit('number-called', data)
  })

  // Broadcast game start
  socket.on('game-start', (data: {
    sessionId: string
    gameId: string
    patternType: string
    patternName: string
    prizeValue: number
  }) => {
    console.log('Game started:', data)
    io.to(`session-${data.sessionId}`).emit('game-start', data)
  })

  // Broadcast game end
  socket.on('game-end', (data: {
    sessionId: string
    gameId: string
    winnerName?: string
    winnerCard?: string
  }) => {
    console.log('Game ended:', data)
    io.to(`session-${data.sessionId}`).emit('game-end', data)
  })

  // Broadcast winner verification
  socket.on('winner-verified', (data: {
    sessionId: string
    gameId: string
    winnerName: string
    winnerCard?: string
    calledNumbers: number[]
  }) => {
    console.log('Winner verified:', data)
    io.to(`session-${data.sessionId}`).emit('winner-verified', data)
  })

  // Broadcast session status update
  socket.on('session-update', (data: {
    sessionId: string
    status: string
    startTime?: string
    endTime?: string
  }) => {
    console.log('Session updated:', data)
    io.to(`session-${data.sessionId}`).emit('session-update', data)
  })

  // Broadcast display mode change
  socket.on('display-mode-change', (data: {
    sessionId: string
    displayMode: 'auto' | 'games-list' | 'current-game'
    currentGame?: any
  }) => {
    console.log('Display mode changed:', data)
    io.to(`session-${data.sessionId}`).emit('display-mode-change', data)
  })

  // Relay auto-call countdown (one tick per second from the control panel).
  // secondsRemaining is null when auto-call is disabled.
  socket.on('auto-call-tick', (data: {
    sessionId: string
    secondsRemaining: number | null
  }) => {
    io.to(`session-${data.sessionId}`).emit('auto-call-tick', data)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connectedClients: io.sockets.sockets.size
  })
})

// Get active sessions
app.get('/api/socket/sessions', (req, res) => {
  const rooms = Array.from(io.sockets.adapter.rooms.keys())
    .filter(room => room.startsWith('session-'))
    .map(room => ({
      sessionId: room.replace('session-', ''),
      clientCount: io.sockets.adapter.rooms.get(room)?.size || 0
    }))
  
  res.json({ sessions: rooms })
})

// Broadcast to specific session (for external API calls)
app.post('/api/socket/broadcast/:sessionId', (req, res) => {
  const { sessionId } = req.params
  const { event, data } = req.body

  if (!event || !data) {
    return res.status(400).json({ error: 'Event and data are required' })
  }

  io.to(`session-${sessionId}`).emit(event, data)
  
  res.json({ 
    success: true, 
    message: `Event '${event}' broadcasted to session ${sessionId}`,
    clientCount: io.sockets.adapter.rooms.get(`session-${sessionId}`)?.size || 0
  })
})

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  
  // Close Socket.IO connections
  io.close(() => {
    console.log('Socket.IO server closed')
  })
  
  // Close database connection
  await prisma.$disconnect()
  console.log('Database connection closed')
  
  // Close HTTP server
  httpServer.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  
  io.close(() => {
    console.log('Socket.IO server closed')
  })
  
  await prisma.$disconnect()
  console.log('Database connection closed')
  
  httpServer.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`)
  console.log(`📡 CORS enabled for: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`)
  console.log(`💾 Database connected`)
  console.log(`🎯 Ready for real-time bingo action!`)
})

export { io, app, httpServer }