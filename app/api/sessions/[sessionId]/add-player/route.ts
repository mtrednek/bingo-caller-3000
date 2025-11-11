import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const authSession = await auth()
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { singlePackets = 0, doublePackets = 0 } = body

    // Validate that at least one packet is purchased
    if (singlePackets + doublePackets === 0) {
      return NextResponse.json({ error: 'Player must purchase at least one packet' }, { status: 400 })
    }

    // Calculate prize pool contribution
    const singlePacketPrice = 10
    const doublePacketPrice = 16
    const additionalRevenue = (singlePackets * singlePacketPrice) + (doublePackets * doublePacketPrice)
    
    // Prize pool = packet price - operating fee ($1 for single, $2 for double)
    const singlePrizeContribution = Math.max(0, singlePacketPrice - 1) // $9 by default
    const doublePrizeContribution = Math.max(0, doublePacketPrice - 2) // $14 by default
    const additionalPrizePool = (singlePackets * singlePrizeContribution) + (doublePackets * doublePrizeContribution)

    // Get current session
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { games: { orderBy: { orderIndex: 'asc' } } }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Calculate new totals
    const newPlayerCount = session.players + 1
    const currentTotalRevenue = session.players * session.packetPrice
    const newTotalRevenue = currentTotalRevenue + additionalRevenue
    
    // For now, we'll approximate the new packet price as total revenue / total players
    // This is a simplified approach until we update the schema to support packet tracking
    const newAvgPacketPrice = newTotalRevenue / newPlayerCount

    // Calculate how to distribute the additional prize pool across games
    const currentTotalPrizes = session.games.reduce((sum, game) => sum + game.prizeValue, 0)
    const newTotalPrizes = currentTotalPrizes + additionalPrizePool
    
    // Distribute the additional prize pool proportionally across games
    const prizeMultiplier = newTotalPrizes / currentTotalPrizes
    
    // Update session and recalculate all game prizes
    const updatedSession = await db.session.update({
      where: { id: sessionId },
      data: {
        players: newPlayerCount,
        packetPrice: newAvgPacketPrice, // Simplified approach
      },
      include: { games: { orderBy: { orderIndex: 'asc' } } }
    })

    // Update all game prizes proportionally
    const updatePromises = session.games.map(game => 
      db.game.update({
        where: { id: game.id },
        data: {
          prizeValue: Math.round(game.prizeValue * prizeMultiplier)
        }
      })
    )

    await Promise.all(updatePromises)

    // Get updated session with new game prizes
    const finalSession = await db.session.findUnique({
      where: { id: sessionId },
      include: { games: { orderBy: { orderIndex: 'asc' } } }
    })

    return NextResponse.json({
      session: finalSession,
      addedPlayer: {
        singlePackets,
        doublePackets,
        revenue: additionalRevenue,
        prizePoolContribution: additionalPrizePool
      }
    })

  } catch (error) {
    console.error('Failed to add player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}