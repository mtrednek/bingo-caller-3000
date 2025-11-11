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
    const { winnerName, winnerCard, calledNumbers } = body

    if (!winnerName) {
      return NextResponse.json({ error: 'Winner name is required' }, { status: 400 })
    }

    // Update game with winner information and mark as completed
    const updatedGame = await db.game.update({
      where: { id: gameId },
      data: {
        status: 'completed',
        endTime: new Date(),
        winnerName,
        winnerCard: winnerCard || null,
        calledNumbers: calledNumbers || []
      },
      include: {
        session: {
          include: {
            games: true
          }
        }
      }
    })

    // Check if all games in the session are completed
    const allGamesCompleted = updatedGame.session.games.every(game => game.status === 'completed')

    // If all games are completed, mark the session as completed
    if (allGamesCompleted && updatedGame.session.status !== 'completed') {
      await db.session.update({
        where: { id: updatedGame.sessionId },
        data: {
          status: 'completed',
          endTime: new Date()
        }
      })

      // Broadcast session-completed event
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api/socket/broadcast/${updatedGame.sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'session-completed',
            data: {
              sessionId: updatedGame.sessionId,
              endTime: new Date()
            }
          })
        })
      } catch (socketError) {
        console.error('Failed to broadcast session completed:', socketError)
      }
    }

    // Broadcast game-end event via Socket.IO
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api/socket/broadcast/${updatedGame.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'game-end',
          data: {
            sessionId: updatedGame.sessionId,
            gameId: updatedGame.id,
            winnerName,
            winnerCard: winnerCard || null
          }
        })
      })

      await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api/socket/broadcast/${updatedGame.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'winner-verified',
          data: {
            sessionId: updatedGame.sessionId,
            gameId: updatedGame.id,
            winnerName,
            winnerCard: winnerCard || null,
            calledNumbers: calledNumbers || []
          }
        })
      })
    } catch (socketError) {
      console.error('Failed to broadcast game end:', socketError)
      // Don't fail the request if socket broadcast fails
    }

    return NextResponse.json({
      game: updatedGame,
      winner: {
        name: winnerName,
        card: winnerCard,
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to record winner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}