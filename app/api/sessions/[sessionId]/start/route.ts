import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { startTime } = body

    if (!startTime) {
      return NextResponse.json({ error: 'Start time is required' }, { status: 400 })
    }

    // Update the session with start time
    const updatedSession = await db.session.update({
      where: { id: sessionId },
      data: { startTime: new Date(startTime) }
    })

    return NextResponse.json({
      success: true,
      startTime: updatedSession.startTime
    })
  } catch (error) {
    console.error('Failed to update session start time:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}