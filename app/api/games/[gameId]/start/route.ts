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

    // Update game status to active
    const game = await db.game.update({
      where: { id: gameId },
      data: {
        status: 'active',
        startTime: new Date(),
        calledNumbers: []
      },
      include: {
        session: true
      }
    })

    // Update session status to active if not already
    if (game.session.status === 'scheduled') {
      await db.session.update({
        where: { id: game.sessionId },
        data: {
          status: 'active',
          startTime: new Date()
        }
      })
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error('Failed to start game:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}