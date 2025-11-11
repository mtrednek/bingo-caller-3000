import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
    const body = await request.json()

    // Extract allowed fields for update
    const { patternColor } = body

    if (!patternColor) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      )
    }

    // Validate hex color format
    if (!/^#[0-9A-F]{6}$/i.test(patternColor)) {
      return NextResponse.json(
        { error: 'Invalid color format. Must be a hex color (e.g., #60a5fa)' },
        { status: 400 }
      )
    }

    // Update the game
    const updatedGame = await db.game.update({
      where: { id: gameId },
      data: { patternColor },
      include: { session: true }
    })

    // Broadcast the color change to all connected clients
    try {
      const socketUrl = process.env.SOCKET_URL || 'http://localhost:3001'
      await fetch(`${socketUrl}/api/socket/broadcast/${updatedGame.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'game-color-updated',
          data: {
            gameId: updatedGame.id,
            patternColor: updatedGame.patternColor
          }
        })
      })
    } catch (error) {
      console.error('Failed to broadcast color update:', error)
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json(updatedGame)
  } catch (error) {
    console.error('Failed to update game:', error)
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    )
  }
}
