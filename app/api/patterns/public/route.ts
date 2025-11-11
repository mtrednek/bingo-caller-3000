import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get patterns from database - no authentication required for public access
    const dbPatterns = await db.pattern.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    const patterns = dbPatterns.map(p => ({
      code: p.code,
      name: p.name,
      altNames: p.altNames as string[],
      category: p.category,
      requiredCells: p.requiredCells as number[],
      difficulty: p.difficulty,
      canRotate: p.canRotate,
      canMirror: p.canMirror,
      description: p.description,
      isActive: p.isActive,
      animationDelay: p.animationDelay
    }))

    return NextResponse.json(patterns)

  } catch (error) {
    console.error('Error fetching public patterns:', error)
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 })
  }
}