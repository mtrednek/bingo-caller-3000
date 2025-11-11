import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

interface GameConfig {
  patternCode: string
  patternName: string
  prizeValue: number
  orderIndex: number
}

/**
 * Generate games using only active patterns from database
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      packetPrice = 10,
      expectedPlayers = 15,
      gameCount = 13,
      prizePercentage = 60
    } = body

    // Get all active patterns from database with their details
    const activeDbPatterns = await db.pattern.findMany({
      where: { isActive: true }
    })

    console.log(`Found ${activeDbPatterns.length} active patterns in database`)

    // Convert database patterns to the format we need
    const activePatterns = activeDbPatterns
      .map(dbPattern => ({
        code: dbPattern.code,
        name: dbPattern.name,
        altNames: Array.isArray(dbPattern.altNames) ? dbPattern.altNames as string[] : [],
        category: dbPattern.category,
        difficulty: dbPattern.difficulty,
        requiredCells: Array.isArray(dbPattern.requiredCells) ? dbPattern.requiredCells as number[] : [],
        description: dbPattern.description,
        isActive: dbPattern.isActive,
        canRotate: dbPattern.canRotate || false,
        animationDelay: dbPattern.animationDelay || undefined
      }))
      .filter(pattern => pattern.requiredCells.length > 0) // Only include patterns with valid cell data

    console.log(`Using ${activePatterns.length} patterns with valid cell data`)
    console.log(`Pattern codes: ${activePatterns.map(p => p.code).join(', ')}`)

    // Select patterns for regular games (difficulty 3-4 preferred)
    const specialPatterns = ['double_bingo', 'coverall']
    const needsSpecialEnding = gameCount >= 11
    const regularGameCount = needsSpecialEnding ? gameCount - 2 : gameCount

    // Start with difficulty 3-4 patterns, excluding special ones
    let availablePatterns = activePatterns.filter(p =>
      (p.difficulty === 3 || p.difficulty === 4) &&
      !specialPatterns.includes(p.code)
    )

    // If we don't have enough difficulty 3-4 patterns, expand to include others
    if (availablePatterns.length < regularGameCount) {
      const usedCodes = new Set(availablePatterns.map(p => p.code))

      // Add difficulty 2 and 5 patterns as backup
      const additionalPatterns = activePatterns.filter(p =>
        !usedCodes.has(p.code) &&
        !specialPatterns.includes(p.code) &&
        (p.difficulty === 2 || p.difficulty === 5)
      )

      availablePatterns = [...availablePatterns, ...additionalPatterns]

      // If still not enough, add difficulty 1 patterns
      if (availablePatterns.length < regularGameCount) {
        const difficulty1Patterns = activePatterns.filter(p =>
          !usedCodes.has(p.code) &&
          !specialPatterns.includes(p.code) &&
          p.difficulty === 1
        )
        availablePatterns = [...availablePatterns, ...difficulty1Patterns]
      }
    }

    // Shuffle and select patterns for regular games, ensuring only one letter and one arrow pattern
    console.log('🎯 STARTING PATTERN SELECTION WITH LETTER & ARROW CONSTRAINTS v2')
    const shuffled = [...availablePatterns].sort(() => Math.random() - 0.5)
    const selectedPatterns = []
    let hasLetterPattern = false
    let hasArrowPattern = false

    console.log(`🎯 Available patterns: ${shuffled.length}, Need: ${regularGameCount}`)

    const letterPatternsAvailable = shuffled.filter(p => p.category === 'letter')
    console.log(`🎯 Letter patterns available: ${letterPatternsAvailable.length} - ${letterPatternsAvailable.map(p => p.code).join(', ')}`)

    // Check for arrow patterns (including both direct arrow patterns and crazy arrow)
    const arrowPatternsAvailable = shuffled.filter(p =>
      p.code.includes('arrow') || p.name.toLowerCase().includes('arrow')
    )
    console.log(`🎯 Arrow patterns available: ${arrowPatternsAvailable.length} - ${arrowPatternsAvailable.map(p => p.code).join(', ')}`)

    for (const pattern of shuffled) {
      if (selectedPatterns.length >= regularGameCount) break

      // Check if this is an arrow pattern
      const isArrowPattern = pattern.code.includes('arrow') || pattern.name.toLowerCase().includes('arrow')

      // If this is a letter pattern and we already have one, skip it
      if (pattern.category === 'letter') {
        if (hasLetterPattern) {
          console.log(`🎯 SKIPPING letter pattern ${pattern.code} - already have one`)
          continue // Skip this letter pattern
        } else {
          console.log(`🎯 SELECTING letter pattern ${pattern.code} - first one`)
          hasLetterPattern = true // Mark that we now have a letter pattern
        }
      }

      // If this is an arrow pattern and we already have one, skip it
      else if (isArrowPattern) {
        if (hasArrowPattern) {
          console.log(`🎯 SKIPPING arrow pattern ${pattern.code} - already have one`)
          continue // Skip this arrow pattern
        } else {
          console.log(`🎯 SELECTING arrow pattern ${pattern.code} - first one`)
          hasArrowPattern = true // Mark that we now have an arrow pattern
        }
      }

      selectedPatterns.push(pattern)
    }

    // If we don't have enough patterns due to letter/arrow constraints, try again with more flexibility
    if (selectedPatterns.length < regularGameCount) {
      console.log(`🎯 Only selected ${selectedPatterns.length} patterns, need ${regularGameCount}. Adding more non-letter/non-arrow patterns...`)

      // Get remaining patterns that are neither letters nor arrows (unless we haven't selected any of that type yet)
      const remainingPatterns = shuffled.filter(p => {
        if (selectedPatterns.includes(p)) return false

        const isArrowPattern = p.code.includes('arrow') || p.name.toLowerCase().includes('arrow')
        const isLetterPattern = p.category === 'letter'

        // Skip if it's a letter and we already have one
        if (isLetterPattern && hasLetterPattern) return false

        // Skip if it's an arrow and we already have one
        if (isArrowPattern && hasArrowPattern) return false

        return true
      })

      // Add remaining patterns until we have enough
      const additionalNeeded = regularGameCount - selectedPatterns.length
      const additionalPatterns = remainingPatterns.slice(0, additionalNeeded)
      selectedPatterns.push(...additionalPatterns)

      console.log(`🎯 Added ${additionalPatterns.length} additional patterns: ${additionalPatterns.map(p => p.code).join(', ')}`)
    }

    console.log(`🎯 FINAL SELECTION: ${selectedPatterns.length} patterns (${hasLetterPattern ? 'includes' : 'excludes'} letter, ${hasArrowPattern ? 'includes' : 'excludes'} arrow)`)
    console.log(`🎯 Selected pattern codes: ${selectedPatterns.map(p => p.code).join(', ')}`)

    // Verify letter constraint is working
    const selectedLetterPatterns = selectedPatterns.filter(p => p.category === 'letter')
    if (selectedLetterPatterns.length > 1) {
      console.error(`❌ LETTER CONSTRAINT VIOLATION: Found ${selectedLetterPatterns.length} letter patterns: ${selectedLetterPatterns.map(p => p.code).join(', ')}`)
    } else if (selectedLetterPatterns.length === 1) {
      console.log(`✅ LETTER CONSTRAINT SATISFIED: One letter pattern selected: ${selectedLetterPatterns[0].code}`)
    } else {
      console.log(`✅ LETTER CONSTRAINT SATISFIED: No letter patterns selected`)
    }

    // Verify arrow constraint is working
    const selectedArrowPatterns = selectedPatterns.filter(p =>
      p.code.includes('arrow') || p.name.toLowerCase().includes('arrow')
    )
    if (selectedArrowPatterns.length > 1) {
      console.error(`❌ ARROW CONSTRAINT VIOLATION: Found ${selectedArrowPatterns.length} arrow patterns: ${selectedArrowPatterns.map(p => p.code).join(', ')}`)
    } else if (selectedArrowPatterns.length === 1) {
      console.log(`✅ ARROW CONSTRAINT SATISFIED: One arrow pattern selected: ${selectedArrowPatterns[0].code}`)
    } else {
      console.log(`✅ ARROW CONSTRAINT SATISFIED: No arrow patterns selected`)
    }

    // Calculate prize distribution
    const prizeValues = calculatePrizeDistribution(expectedPlayers, packetPrice, gameCount, prizePercentage)

    const games: GameConfig[] = []

    // Add regular games
    for (let i = 0; i < selectedPatterns.length; i++) {
      const pattern = selectedPatterns[i]
      if (!pattern) continue

      games.push({
        patternCode: pattern.code,
        patternName: pattern.name,
        prizeValue: prizeValues[i] || 0,
        orderIndex: i
      })
    }

    // Add special ending games if needed
    if (needsSpecialEnding) {
      const activeSpecialPatterns = activePatterns.filter(p =>
        specialPatterns.includes(p.code)
      )

      // Penultimate game: Double Bingo (if active)
      const doubleBingoPattern = activeSpecialPatterns.find(p => p.code === 'double_bingo')
      if (doubleBingoPattern) {
        games.push({
          patternCode: 'double_bingo',
          patternName: doubleBingoPattern.name,
          prizeValue: prizeValues[prizeValues.length - 2] || 0,
          orderIndex: games.length
        })
      }

      // Final game: Coverall (if active)
      const coverallPattern = activeSpecialPatterns.find(p => p.code === 'coverall')
      if (coverallPattern) {
        games.push({
          patternCode: 'coverall',
          patternName: coverallPattern.name,
          prizeValue: prizeValues[prizeValues.length - 1] || 0,
          orderIndex: games.length
        })
      }
    }

    // Validate the configuration
    const validation = validateGameConfiguration(games, activePatterns)

    return NextResponse.json({
      games,
      validation,
      activePatternCount: activePatterns.length
    })

  } catch (error) {
    console.error('Failed to generate games:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Calculate prize distribution for games based on industry standards
 */
function calculatePrizeDistribution(
  players: number,
  packetPrice: number,
  gameCount: number,
  prizePercentage: number = 60
): number[] {
  const totalRevenue = players * packetPrice
  const totalPrizePool = totalRevenue * (prizePercentage / 100)

  const prizes: number[] = []
  const needsSpecialEnding = gameCount >= 11
  const regularGames = needsSpecialEnding ? gameCount - 2 : gameCount

  if (needsSpecialEnding) {
    // Reserve 40% of prize pool for final two games
    const specialPrizePool = totalPrizePool * 0.4
    const regularPrizePool = totalPrizePool * 0.6

    // Calculate regular game prizes (progressive increase)
    for (let i = 0; i < regularGames; i++) {
      // Progressive multiplier from 0.5 to 1.5
      const multiplier = 0.5 + (i / (regularGames - 1))
      const basePrize = (regularPrizePool / regularGames)
      prizes.push(Math.round(basePrize * multiplier))
    }

    // Special ending games
    const doubleBingoPrize = Math.round(specialPrizePool * 0.4) // 40% of special pool
    const coverallPrize = Math.round(specialPrizePool * 0.6)    // 60% of special pool

    prizes.push(doubleBingoPrize)
    prizes.push(coverallPrize)
  } else {
    // For sessions without special ending, distribute evenly with slight progression
    for (let i = 0; i < gameCount; i++) {
      const multiplier = 0.7 + (i / (gameCount - 1)) * 0.6 // 0.7 to 1.3 multiplier
      const basePrize = totalPrizePool / gameCount
      prizes.push(Math.round(basePrize * multiplier))
    }
  }

  // Ensure prizes are positive and round to nearest dollar
  return prizes.map(prize => Math.max(1, Math.round(prize)))
}

/**
 * Validate game configuration for common issues
 */
function validateGameConfiguration(games: GameConfig[], patterns: any[] = []) {
  const issues: string[] = []

  // Check for duplicate patterns
  const patternCounts = games.reduce((acc, game) => {
    acc[game.patternCode] = (acc[game.patternCode] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  Object.entries(patternCounts).forEach(([pattern, count]) => {
    if (count > 1) {
      issues.push(`Pattern "${pattern}" is used ${count} times - all patterns should be unique`)
    }
  })

  // Check for proper ending sequence for 11+ games
  if (games.length >= 11) {
    const penultimate = games[games.length - 2]
    const final = games[games.length - 1]

    if (penultimate.patternCode !== 'double_bingo') {
      issues.push('Penultimate game should be Double Bingo for sessions with 11+ games')
    }

    if (final.patternCode !== 'coverall') {
      issues.push('Final game should be Coverall for sessions with 11+ games')
    }
  }

  // Check for multiple letter patterns (only one letter pattern allowed per session)
  // Check for multiple arrow patterns (only one arrow pattern allowed per session)
  if (patterns.length > 0) {
    const patternMap = patterns.reduce((acc, p) => {
      acc[p.code] = p
      return acc
    }, {} as Record<string, any>)

    // Check letter patterns
    const letterPatterns = games.filter(game => {
      const pattern = patternMap[game.patternCode]
      return pattern && pattern.category === 'letter'
    })

    if (letterPatterns.length > 1) {
      const letterNames = letterPatterns.map(g => g.patternName).join(', ')
      issues.push(`Multiple letter patterns found: ${letterNames}. Only one letter pattern is allowed per session.`)
    }

    // Check arrow patterns
    const arrowPatterns = games.filter(game => {
      const pattern = patternMap[game.patternCode]
      return pattern && (pattern.code.includes('arrow') || pattern.name.toLowerCase().includes('arrow'))
    })

    if (arrowPatterns.length > 1) {
      const arrowNames = arrowPatterns.map(g => g.patternName).join(', ')
      issues.push(`Multiple arrow patterns found: ${arrowNames}. Only one arrow pattern is allowed per session.`)
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}