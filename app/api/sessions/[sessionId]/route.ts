import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        games: {
          orderBy: { orderIndex: 'asc' }
        },
        user: {
          select: { username: true, email: true }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Failed to fetch session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const authSession = await auth()
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if session exists and user owns it or is admin
    const session = await db.session.findUnique({
      where: { id: sessionId },
      select: { userId: true }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.userId !== authSession.user.id && authSession.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete session (games will be deleted via cascade)
    await db.session.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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
    const {
      status,
      startTime,
      endTime,
      name,
      players,
      duration,
      singlePackets,
      doublePackets,
      singlePacketPrice,
      doublePacketPrice,
      operatingCost,
      operatingCostType,
      recalculatePrizes = false,
      games
    } = body

    // Build update data object dynamically
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (startTime !== undefined) updateData.startTime = startTime ? new Date(startTime) : undefined
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : undefined
    if (name !== undefined) updateData.name = name
    if (players !== undefined) updateData.players = players
    if (duration !== undefined) updateData.duration = duration
    if (singlePackets !== undefined) updateData.singlePackets = singlePackets
    if (doublePackets !== undefined) updateData.doublePackets = doublePackets
    if (singlePacketPrice !== undefined) updateData.singlePacketPrice = singlePacketPrice
    if (doublePacketPrice !== undefined) updateData.doublePacketPrice = doublePacketPrice
    if (operatingCost !== undefined) updateData.operatingCost = operatingCost
    if (operatingCostType !== undefined) updateData.operatingCostType = operatingCostType

    const updatedSession = await db.session.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        games: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    // If games are provided, update them
    if (games && Array.isArray(games)) {
      // Get existing games
      const existingGames = await db.game.findMany({
        where: { sessionId },
        select: { id: true }
      })
      const existingGameIds = new Set(existingGames.map(g => g.id))
      const newGameIds = new Set(games.map((g: any) => g.id))

      // Delete games that are no longer in the list
      const gamesToDelete = existingGames.filter(g => !newGameIds.has(g.id))
      if (gamesToDelete.length > 0) {
        await db.game.deleteMany({
          where: {
            id: { in: gamesToDelete.map(g => g.id) }
          }
        })
      }

      // Update or create games
      for (let i = 0; i < games.length; i++) {
        const game = games[i]
        const gameData = {
          patternType: game.patternCode,
          patternName: game.patternName,
          prizeValue: game.prizeValue,
          orderIndex: i
        }

        if (existingGameIds.has(game.id)) {
          // Update existing game
          await db.game.update({
            where: { id: game.id },
            data: gameData
          })
        } else {
          // Create new game
          await db.game.create({
            data: {
              ...gameData,
              sessionId,
              status: 'pending'
            }
          })
        }
      }
    }

    // If recalculatePrizes is true, recalculate game prizes based on new configuration
    if (recalculatePrizes) {
      // Calculate total revenue
      const totalRevenue = (updatedSession.singlePackets * updatedSession.singlePacketPrice) +
                          (updatedSession.doublePackets * updatedSession.doublePacketPrice)

      // Calculate operating costs
      const totalPackets = updatedSession.singlePackets + updatedSession.doublePackets
      const operatingCosts = updatedSession.operatingCostType === 'player'
        ? updatedSession.players * updatedSession.operatingCost
        : totalPackets * updatedSession.operatingCost

      // Calculate prize pool (revenue - operating costs)
      const totalPrizePool = Math.max(0, totalRevenue - operatingCosts)

      // Calculate prize distribution
      const games = updatedSession.games
      const totalGames = games.length
      const regularGameCount = Math.max(0, totalGames - 2)

      // Regular games get 1 share, last 2 games get 2 shares each
      const totalShares = regularGameCount + 4
      const standardPrize = Math.floor(totalPrizePool / totalShares)
      const doublePrize = standardPrize * 2

      // Update game prizes
      const updatePromises = games.map((game, index) => {
        const isDoubleGame = index >= totalGames - 2
        const newPrizeValue = isDoubleGame ? doublePrize : standardPrize

        return db.game.update({
          where: { id: game.id },
          data: { prizeValue: newPrizeValue }
        })
      })

      await Promise.all(updatePromises)

      // Get updated session with new prizes
      const finalSession = await db.session.findUnique({
        where: { id: sessionId },
        include: {
          games: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      })

      return NextResponse.json(finalSession)
    }

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Failed to update session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}