import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { computeSessionMetrics, MetricGame } from '@/lib/session-metrics'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const authSession = await auth()
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { games: { orderBy: { orderIndex: 'asc' } } },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status !== 'completed') {
      return NextResponse.json(
        { error: 'Metrics are only available for completed sessions.' },
        { status: 403 }
      )
    }

    const games: MetricGame[] = session.games.map((g) => ({
      id: g.id,
      orderIndex: g.orderIndex,
      patternName: g.patternName,
      prizeValue: g.prizeValue,
      status: g.status,
      winnerName: g.winnerName,
      startTime: g.startTime,
      endTime: g.endTime,
      calledNumbers: Array.isArray(g.calledNumbers) ? (g.calledNumbers as number[]) : [],
    }))

    const metrics = computeSessionMetrics(games)

    return NextResponse.json({
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        players: session.players,
      },
      metrics,
    })
  } catch (error) {
    console.error('Failed to compute session metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
