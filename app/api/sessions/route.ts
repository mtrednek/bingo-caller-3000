import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await db.session.findMany({
      include: {
        games: {
          orderBy: { orderIndex: 'asc' }
        },
        user: {
          select: { username: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/sessions called')

    const session = await auth()
    console.log('Auth session:', session?.user?.username, session?.user?.id)

    if (!session?.user) {
      console.log('No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      players,
      duration,
      singlePackets,
      doublePackets,
      singlePacketPrice,
      doublePacketPrice,
      operatingCost,
      operatingCostType,
      games
    } = body

    console.log('Request body:', { name, players, duration, gamesCount: games?.length })

    if (!name || players === undefined || !duration || !games?.length) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Ensure we have a valid user ID
    if (!session.user.id) {
      console.log('User ID not available in session')
      return NextResponse.json({ error: 'User ID not available' }, { status: 400 })
    }

    // Validate user exists
    console.log('Validating user exists:', session.user.id)
    const userExists = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!userExists) {
      console.log('User not found in database:', session.user.id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('User validation passed:', userExists.username)

    // Validate all pattern codes exist and build a map of patterns
    const patternCodes = games.map((game: any) => game.patternCode)
    const existingPatterns = await db.pattern.findMany({
      where: { code: { in: patternCodes } }
    })

    const patternMap = new Map(existingPatterns.map(p => [p.code, p]))
    const invalidPatterns = patternCodes.filter((code: string) => !patternMap.has(code))

    if (invalidPatterns.length > 0) {
      return NextResponse.json({
        error: `Invalid pattern codes: ${invalidPatterns.join(', ')}`
      }, { status: 400 })
    }

    console.log('Creating session with user ID:', session.user.id)
    console.log('Pattern codes:', patternCodes)

    // Create session with games
    const newSession = await db.session.create({
      data: {
        name,
        players,
        duration,
        singlePackets: singlePackets || 0,
        doublePackets: doublePackets || 0,
        singlePacketPrice: singlePacketPrice || 10.00,
        doublePacketPrice: doublePacketPrice || 16.00,
        operatingCost: operatingCost || 1.00,
        operatingCostType: operatingCostType || 'player',
        userId: session.user.id,
        games: {
          create: games.map((game: any, index: number) => {
            const pattern = patternMap.get(game.patternCode)
            return {
              orderIndex: index,
              patternType: game.patternCode,
              patternName: game.patternName || game.patternCode,
              prizeValue: game.prizeValue || 0,
              excludedRanges: pattern?.excludedRanges || []
            }
          })
        }
      },
      include: {
        games: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    return NextResponse.json(newSession, { status: 201 })
  } catch (error) {
    console.error('Failed to create session:', error)

    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    return NextResponse.json({
      error: 'Failed to create session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}