import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketEvents {
  'number-called': (data: {
    sessionId: string
    gameId: string
    number: number
    display: string
    callCount: number
  }) => void
  'game-start': (data: {
    sessionId: string
    gameId: string
    patternType: string
    patternName: string
    prizeValue: number
  }) => void
  'game-end': (data: {
    sessionId: string
    gameId: string
    winnerName?: string
    winnerCard?: string
  }) => void
  'winner-verified': (data: {
    sessionId: string
    gameId: string
    winnerName: string
    winnerCard?: string
    calledNumbers: number[]
  }) => void
  'session-update': (data: {
    sessionId: string
    status: string
    startTime?: string
    endTime?: string
  }) => void
  'display-mode-change': (data: {
    sessionId: string
    displayMode: 'auto' | 'games-list' | 'current-game'
    currentGame?: any
  }) => void
  'auto-call-tick': (data: {
    sessionId: string
    secondsRemaining: number | null
  }) => void
}

export function useSocket(sessionId?: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Only connect if we have a session ID
    if (!sessionId) return

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3001`

    console.log('Connecting to Socket.IO server:', socketUrl)

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket.id)
      setIsConnected(true)
      
      // Join the session room
      if (sessionId) {
        socket.emit('join-session', sessionId)
        console.log('Joined session:', sessionId)
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error)
      setIsConnected(false)
    })

    // Listen for all game events
    socket.on('number-called', (data) => {
      console.log('Number called received:', data)
      setLastMessage({ type: 'number-called', data })
    })

    socket.on('game-start', (data) => {
      console.log('Game start received:', data)
      setLastMessage({ type: 'game-start', data })
    })

    socket.on('game-end', (data) => {
      console.log('Game end received:', data)
      setLastMessage({ type: 'game-end', data })
    })

    socket.on('winner-verified', (data) => {
      console.log('Winner verified received:', data)
      setLastMessage({ type: 'winner-verified', data })
    })

    socket.on('session-update', (data) => {
      console.log('Session update received:', data)
      setLastMessage({ type: 'session-update', data })
    })

    return () => {
      if (sessionId) {
        socket.emit('leave-session', sessionId)
      }
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [sessionId])

  // Stable identity — reads through refs so callers can put `emit` in
  // useEffect deps without re-firing every render.
  const isConnectedRef = useRef(isConnected)
  useEffect(() => {
    isConnectedRef.current = isConnected
  }, [isConnected])

  const emit = useCallback(<K extends keyof SocketEvents>(
    event: K,
    data: Parameters<SocketEvents[K]>[0]
  ) => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit(event, data)
    } else {
      console.warn(`Cannot emit ${event}: socket not connected`)
    }
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    emit
  }
}

// Hook specifically for display screens
export function useDisplaySocket(sessionId: string) {
  const { isConnected, lastMessage, emit } = useSocket(sessionId)
  const [gameState, setGameState] = useState({
    isActive: false,
    currentGame: null,
    lastCall: '',
    calledNumbers: [] as number[],
    pattern: null
  })

  useEffect(() => {
    if (!lastMessage) return

    switch (lastMessage.type) {
      case 'game-start':
        setGameState(prev => ({
          ...prev,
          isActive: true,
          currentGame: lastMessage.data,
          lastCall: '',
          calledNumbers: [],
          pattern: lastMessage.data.pattern
        }))
        break

      case 'number-called':
        setGameState(prev => ({
          ...prev,
          lastCall: lastMessage.data.display,
          calledNumbers: [...prev.calledNumbers, lastMessage.data.number]
        }))
        break

      case 'game-end':
        setGameState(prev => ({
          ...prev,
          isActive: false
        }))
        break

      case 'winner-verified':
        setGameState(prev => ({
          ...prev,
          isActive: false
        }))
        break
    }
  }, [lastMessage])

  return {
    isConnected,
    gameState,
    lastMessage
  }
}

// Hook specifically for game control
export function useGameControlSocket(sessionId: string) {
  const { isConnected, emit } = useSocket(sessionId)

  const emitNumberCall = (data: {
    gameId: string
    number: number
    display: string
    callCount: number
  }) => {
    emit('number-called', {
      sessionId,
      ...data
    })
  }

  const emitGameStart = (data: {
    gameId: string
    patternType: string
    patternName: string
    prizeValue: number
  }) => {
    emit('game-start', {
      sessionId,
      ...data
    })
  }

  const emitGameEnd = (data: {
    gameId: string
    winnerName?: string
    winnerCard?: string
  }) => {
    emit('game-end', {
      sessionId,
      ...data
    })
  }

  const emitWinnerVerified = (data: {
    gameId: string
    winnerName: string
    winnerCard?: string
    calledNumbers: number[]
  }) => {
    emit('winner-verified', {
      sessionId,
      ...data
    })
  }

  return {
    isConnected,
    emitNumberCall,
    emitGameStart,
    emitGameEnd,
    emitWinnerVerified
  }
}