import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { number, display } = body

    if (!number || !display) {
      return NextResponse.json({ error: 'Missing number or display' }, { status: 400 })
    }

    // Get current game
    const game = await db.game.findUnique({
      where: { id: gameId }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Add number to called numbers
    const currentCalls = Array.isArray(game.calledNumbers) 
      ? game.calledNumbers as number[]
      : []
    
    const updatedCalls = [...currentCalls, number]

    // Update game with new called number
    const updatedGame = await db.game.update({
      where: { id: gameId },
      data: {
        calledNumbers: updatedCalls
      }
    })

    // TODO: Broadcast to WebSocket clients
    // This will be implemented when we add the Socket.io server

    return NextResponse.json({
      game: updatedGame,
      call: { number, display },
      totalCalls: updatedCalls.length
    })
  } catch (error) {
    console.error('Failed to record call:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}