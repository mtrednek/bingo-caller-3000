import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await params

    const pattern = await db.pattern.findUnique({
      where: {
        code: code,
        isActive: true
      }
    })

    if (!pattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
    }

    return NextResponse.json({
      code: pattern.code,
      name: pattern.name,
      altNames: pattern.altNames as string[],
      category: pattern.category,
      requiredCells: pattern.requiredCells as number[],
      difficulty: pattern.difficulty,
      description: pattern.description,
      canRotate: pattern.canRotate,
      canMirror: pattern.canMirror,
      isActive: pattern.isActive,
      animationDelay: pattern.animationDelay,
      excludedRanges: pattern.excludedRanges as string[]
    })

  } catch (error) {
    console.error('Error fetching pattern:', error)
    return NextResponse.json({ error: 'Failed to fetch pattern' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await params
    const body = await request.json()
    const { name, altNames, category, requiredCells, difficulty, canRotate, canMirror, description, isActive, animationDelay, excludedRanges } = body

    // Validate required fields
    if (!name || !description || !requiredCells?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, and requiredCells' },
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

    // Check if pattern exists
    const existingPattern = await db.pattern.findUnique({
      where: { code: code }
    })

    if (!existingPattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
    }

    // Validate excludedRanges if provided
    if (excludedRanges !== undefined) {
      if (!Array.isArray(excludedRanges)) {
        return NextResponse.json(
          { error: 'excludedRanges must be an array' },
          { status: 400 }
        )
      }

      const validLetters = ['B', 'I', 'N', 'G', 'O']
      if (excludedRanges.some((letter: string) => !validLetters.includes(letter))) {
        return NextResponse.json(
          { error: 'excludedRanges must only contain B, I, N, G, or O' },
          { status: 400 }
        )
      }
    }

    // Update the pattern
    const updatedPattern = await db.pattern.update({
      where: { code: code },
      data: {
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
        excludedRanges: excludedRanges !== undefined ? excludedRanges : existingPattern.excludedRanges
      }
    })

    return NextResponse.json({
      code: updatedPattern.code,
      name: updatedPattern.name,
      altNames: updatedPattern.altNames as string[],
      category: updatedPattern.category,
      requiredCells: updatedPattern.requiredCells as number[],
      difficulty: updatedPattern.difficulty,
      canRotate: updatedPattern.canRotate,
      canMirror: updatedPattern.canMirror,
      description: updatedPattern.description,
      isActive: updatedPattern.isActive,
      animationDelay: updatedPattern.animationDelay,
      excludedRanges: updatedPattern.excludedRanges as string[]
    })

  } catch (error) {
    console.error('Error updating pattern:', error)
    return NextResponse.json({ error: 'Failed to update pattern' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await params
    const body = await request.json()
    const { isActive } = body

    // Validate isActive field
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean value' },
        { status: 400 }
      )
    }

    // Check if pattern exists
    const existingPattern = await db.pattern.findUnique({
      where: { code: code }
    })

    if (!existingPattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
    }

    // If deactivating, check if pattern is being used in any active games
    if (!isActive) {
      const activeGames = await db.game.findMany({
        where: {
          patternType: code,
          status: {
            in: ['pending', 'active']
          }
        }
      })

      if (activeGames.length > 0) {
        return NextResponse.json(
          { error: 'Cannot deactivate pattern - it is currently being used in active games' },
          { status: 409 }
        )
      }
    }

    // Update the pattern status
    const updatedPattern = await db.pattern.update({
      where: { code: code },
      data: { isActive }
    })

    return NextResponse.json({
      code: updatedPattern.code,
      name: updatedPattern.name,
      altNames: updatedPattern.altNames as string[],
      category: updatedPattern.category,
      requiredCells: updatedPattern.requiredCells as number[],
      difficulty: updatedPattern.difficulty,
      description: updatedPattern.description,
      canRotate: updatedPattern.canRotate,
      canMirror: updatedPattern.canMirror,
      isActive: updatedPattern.isActive,
      animationDelay: updatedPattern.animationDelay,
      excludedRanges: updatedPattern.excludedRanges as string[]
    })

  } catch (error) {
    console.error('Error updating pattern status:', error)
    return NextResponse.json({ error: 'Failed to update pattern status' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await params

    // Check if pattern exists
    const existingPattern = await db.pattern.findUnique({
      where: { code: code }
    })

    if (!existingPattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
    }

    // Check if pattern is being used in any active games
    const activeGames = await db.game.findMany({
      where: {
        patternType: code,
        status: {
          in: ['pending', 'active']
        }
      }
    })

    if (activeGames.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete pattern - it is currently being used in active games' },
        { status: 409 }
      )
    }

    // Soft delete by setting isActive to false
    await db.pattern.update({
      where: { code: code },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Pattern deleted successfully' })

  } catch (error) {
    console.error('Error deleting pattern:', error)
    return NextResponse.json({ error: 'Failed to delete pattern' }, { status: 500 })
  }
}