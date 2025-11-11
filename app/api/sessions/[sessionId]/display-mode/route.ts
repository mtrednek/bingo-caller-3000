import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

// In-memory storage for display modes (in production, you'd use a database or Redis)
const displayModes = new Map<string, {
  mode: 'auto' | 'games-list' | 'current-game'
  currentGame?: any
  updatedAt: Date
}>()

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
    const { displayMode, currentGame } = body

    if (!['auto', 'games-list', 'current-game'].includes(displayMode)) {
      return NextResponse.json({ error: 'Invalid display mode' }, { status: 400 })
    }

    // Store display mode
    displayModes.set(sessionId, {
      mode: displayMode,
      currentGame: currentGame || null,
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      displayMode,
      currentGame: currentGame || null,
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('Failed to update display mode:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    
    const displayModeData = displayModes.get(sessionId)
    
    return NextResponse.json({
      displayMode: displayModeData?.mode || 'auto',
      currentGame: displayModeData?.currentGame || null,
      updatedAt: displayModeData?.updatedAt || null
    })
  } catch (error) {
    console.error('Failed to get display mode:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}