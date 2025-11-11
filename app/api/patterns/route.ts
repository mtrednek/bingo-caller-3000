import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get patterns from database only
    const dbPatterns = await db.pattern.findMany({
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
      animationDelay: p.animationDelay,
      excludedRanges: p.excludedRanges as string[]
    }))

    return NextResponse.json(patterns)

  } catch (error) {
    console.error('Error fetching patterns:', error)
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, altNames, category, requiredCells, difficulty, canRotate, canMirror, description, isActive, animationDelay, excludedRanges } = body

    // Validate required fields
    if (!code || !name || !description || !requiredCells?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name, description, and requiredCells' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['line', 'letter', 'shape', 'special', 'holiday', 'block', 'crazy']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Validate difficulty
    if (difficulty < 1 || difficulty > 5) {
      return NextResponse.json(
        { error: 'Difficulty must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate required cells
    if (!Array.isArray(requiredCells) || requiredCells.some(cell => cell < 0 || cell > 24)) {
      return NextResponse.json(
        { error: 'Invalid required cells - must be array of numbers 0-24' },
        { status: 400 }
      )
    }

    // Check if pattern code already exists
    const existingPattern = await db.pattern.findUnique({
      where: { code }
    })

    if (existingPattern) {
      return NextResponse.json(
        { error: 'Pattern code already exists' },
        { status: 409 }
      )
    }

    // Validate excludedRanges if provided
    if (excludedRanges && !Array.isArray(excludedRanges)) {
      return NextResponse.json(
        { error: 'excludedRanges must be an array' },
        { status: 400 }
      )
    }

    const validLetters = ['B', 'I', 'N', 'G', 'O']
    if (excludedRanges && excludedRanges.some((letter: string) => !validLetters.includes(letter))) {
      return NextResponse.json(
        { error: 'excludedRanges must only contain B, I, N, G, or O' },
        { status: 400 }
      )
    }

    // Create the pattern
    const newPattern = await db.pattern.create({
      data: {
        code,
        name,
        altNames: altNames || [],
        category,
        requiredCells,
        difficulty,
        description,
        isActive: isActive !== undefined ? isActive : true,
        canRotate: canRotate || false,
        canMirror: canMirror || false,
        animationDelay: animationDelay || null,
        excludedRanges: excludedRanges || []
      }
    })

    return NextResponse.json({
      code: newPattern.code,
      name: newPattern.name,
      altNames: newPattern.altNames as string[],
      category: newPattern.category,
      requiredCells: newPattern.requiredCells as number[],
      difficulty: newPattern.difficulty,
      canRotate: newPattern.canRotate,
      canMirror: newPattern.canMirror,
      description: newPattern.description,
      isActive: newPattern.isActive,
      animationDelay: newPattern.animationDelay,
      excludedRanges: newPattern.excludedRanges as string[]
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating pattern:', error)
    return NextResponse.json({ error: 'Failed to create pattern' }, { status: 500 })
  }
}