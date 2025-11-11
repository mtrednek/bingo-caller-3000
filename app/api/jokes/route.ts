import { NextResponse } from 'next/server'
import jokes from '@/lib/jokes.json'

export async function GET() {
  try {
    return NextResponse.json(jokes)
  } catch (error) {
    console.error('Failed to get jokes:', error)
    return NextResponse.json(
      { error: 'Failed to get jokes' },
      { status: 500 }
    )
  }
}
