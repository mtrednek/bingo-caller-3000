// This is a fallback client-side version - patterns should come from database via API

export interface DefaultGameConfig {
  patternCode: string
  patternName: string
  prizeValue: number
  orderIndex: number
}

// Define BingoPattern interface locally since we removed the import
interface BingoPattern {
  code: string
  name: string
  altNames: string[]
  category: 'line' | 'letter' | 'shape' | 'special' | 'holiday' | 'block' | 'crazy'
  requiredCells: number[]
  difficulty: 1 | 2 | 3 | 4 | 5
  canRotate?: boolean
  description: string
  isActive?: boolean
  animationDelay?: number | null
}

/**
 * Get all patterns with difficulty ranking of 3 or 4
 * Note: This is the fallback client-side version - use API route for active pattern filtering
 */
function getEligiblePatterns(): BingoPattern[] {
  // Return empty array since patterns should come from database
  console.warn('getEligiblePatterns called - patterns should come from database via API')
  return []
}

/**
 * Randomly select unique patterns from eligible pool
 * Expands to include other difficulties if not enough eligible patterns
 * Excludes special ending patterns (double_bingo, coverall) from regular selection
 * Note: This is the fallback client-side version - use API route for active pattern filtering
 */
function selectRandomPatterns(count: number, excludeSpecialEnding: boolean = true): string[] {
  // This fallback function should not be used - patterns should come from database
  console.warn('selectRandomPatterns called - patterns should come from database via API')
  return []
}


/**
 * Generate default games for a new session with automatic prize calculation
 * Uses randomly selected patterns with difficulty ranking 3 or 4
 * For sessions with 11+ games, the last two games are always double_bingo (penultimate) and coverall (final)
 * Note: This is the fallback client-side version - use API route for active pattern filtering
 * @param packetPrice - Price per packet to calculate prizes
 * @param expectedPlayers - Number of expected players for prize calculation
 * @param gameCount - Number of games to generate (default 13)
 * @param prizePercentage - Percentage of revenue to allocate to prizes (default 60%)
 * @returns Array of default game configurations with calculated prize values
 */
export function generateDefaultGames(
  packetPrice: number = 10,
  expectedPlayers: number = 15,
  gameCount: number = 13,
  prizePercentage: number = 60
): DefaultGameConfig[] {
  const games: DefaultGameConfig[] = []

  // Calculate prize distribution
  const prizeValues = calculatePrizeDistribution(expectedPlayers, packetPrice, gameCount, prizePercentage)

  // Determine how many regular games we need (reserve last 2 slots for special games if gameCount >= 11)
  const needsSpecialEnding = gameCount >= 11
  const regularGameCount = needsSpecialEnding ? gameCount - 2 : gameCount

  // Randomly select unique patterns for regular games
  const patterns = selectRandomPatterns(regularGameCount)

  // Add regular games with calculated prizes
  for (let i = 0; i < patterns.length; i++) {
    const patternCode = patterns[i]
    // Since this is fallback and we can't access patterns, just use the code as name
    console.warn(`generateDefaultGames called - should use API route instead`)

    games.push({
      patternCode,
      patternName: patternCode, // Fallback - real pattern names should come from database
      prizeValue: prizeValues[i] || 0,
      orderIndex: i
    })
  }

  // Add special ending games for sessions with 11+ games
  if (needsSpecialEnding) {
    // Penultimate game: Double Bingo
    console.warn(`generateDefaultGames special ending called - should use API route instead`)
    games.push({
      patternCode: 'double_bingo',
      patternName: 'double_bingo', // Fallback - real pattern names should come from database
      prizeValue: prizeValues[prizeValues.length - 2] || 0,
      orderIndex: games.length
    })

    // Final game: Coverall
    games.push({
      patternCode: 'coverall',
      patternName: 'coverall', // Fallback - real pattern names should come from database
      prizeValue: prizeValues[prizeValues.length - 1] || 0,
      orderIndex: games.length
    })
  }

  return games
}

/**
 * Generate a validated session with guaranteed unique patterns and calculated prizes
 * This is the recommended function for creating new sessions
 * Note: This is the fallback client-side version - use API route for active pattern filtering
 */
export function generateValidatedSession(
  packetPrice: number = 10,
  expectedPlayers: number = 15,
  gameCount: number = 13,
  prizePercentage: number = 60
): { games: DefaultGameConfig[], validation: { isValid: boolean, issues: string[] } } {
  const games = generateDefaultGames(packetPrice, expectedPlayers, gameCount, prizePercentage)
  const validation = validateGameConfiguration(games)

  // If validation fails due to uniqueness issues, try regenerating once
  if (!validation.isValid && validation.issues.some(issue => issue.includes('used'))) {
    const retryGames = generateDefaultGames(packetPrice, expectedPlayers, gameCount, prizePercentage)
    const retryValidation = validateGameConfiguration(retryGames)
    return {
      games: retryGames,
      validation: retryValidation
    }
  }

  return { games, validation }
}

/**
 * Recalculate prize values for existing games when session parameters change
 * Preserves game patterns and order, only updates prize values
 */
export function recalculateGamePrizes(
  games: DefaultGameConfig[],
  players: number,
  packetPrice: number,
  prizePercentage: number = 60
): DefaultGameConfig[] {
  if (games.length === 0) return games
  
  const newPrizeValues = calculatePrizeDistribution(players, packetPrice, games.length, prizePercentage)
  
  return games.map((game, index) => ({
    ...game,
    prizeValue: newPrizeValues[index] || 0
  }))
}

/**
 * Get suggested patterns based on session type
 * All suggestions are filtered to difficulty 3 or 4 patterns
 * Note: This is the fallback client-side version - use API route for active pattern filtering
 */
export function getPatternSuggestions(sessionType: 'regular' | 'special' | 'holiday', count: number = 13): string[] {
  // This fallback function should not be used - patterns should come from database
  console.warn('getPatternSuggestions called - patterns should come from database via API')
  return []
}

/**
 * Calculate prize distribution for games based on industry standards
 * Returns array of prize values that should be assigned to games in order
 */
export function calculatePrizeDistribution(
  players: number,
  packetPrice: number,
  gameCount: number,
  prizePercentage: number = 60 // Default 60% of revenue goes to prizes
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
 * Calculate total prize pool and revenue projections
 */
export function calculateSessionFinancials(
  players: number,
  packetPrice: number,
  sheetsPerPacket: number,
  games: DefaultGameConfig[]
) {
  const totalRevenue = players * packetPrice
  const totalPrizes = games.reduce((sum, game) => sum + game.prizeValue, 0)
  const netRevenue = totalRevenue - totalPrizes
  const prizePercentage = (totalPrizes / totalRevenue) * 100
  
  return {
    totalRevenue,
    totalPrizes,
    netRevenue,
    prizePercentage,
    sheetsTotal: players * sheetsPerPacket,
    averagePrizePerGame: totalPrizes / games.length,
    revenuePerSheet: totalRevenue / (players * sheetsPerPacket)
  }
}

/**
 * Validate game configuration for common issues
 */
export function validateGameConfiguration(games: DefaultGameConfig[]) {
  const issues: string[] = []
  
  // Check for duplicate patterns - all patterns should be unique in a session
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
  
  // Check prize progression (excluding final 2 games which are special)
  const regularGames = games.length >= 11 ? games.slice(0, -2) : games
  if (regularGames.length > 1) {
    const prizes = regularGames.map(g => g.prizeValue)
    let hasProgression = true
    for (let i = 1; i < prizes.length; i++) {
      if (prizes[i] < prizes[i - 1]) {
        hasProgression = false
        break
      }
    }
    
    if (!hasProgression) {
      issues.push('Prize values should generally increase throughout regular games')
    }
  }
  
  // Check final games have higher prizes (only if we have special ending)
  if (games.length >= 11) {
    const lastTwo = games.slice(-2)
    const regularGames = games.slice(0, -2)
    
    if (regularGames.length > 0) {
      const maxRegularPrize = Math.max(...regularGames.map(g => g.prizeValue))
      
      lastTwo.forEach((game, idx) => {
        const gamePosition = idx === 0 ? 'penultimate' : 'final'
        if (game.prizeValue <= maxRegularPrize) {
          issues.push(`${gamePosition.charAt(0).toUpperCase() + gamePosition.slice(1)} game (${game.patternName}) should have a higher prize than regular games`)
        }
      })
    }
  }

  // Check for multiple letter patterns (only one letter pattern allowed per session)
  // Check for multiple arrow patterns (only one arrow pattern allowed per session)
  // Note: This validation is limited since we don't have pattern category data in this fallback function
  const possibleLetterPatterns = ['letter_a', 'letter_b', 'letter_c', 'letter_d', 'letter_e', 'letter_f', 'letter_g', 'letter_h', 'letter_i', 'letter_j', 'letter_k', 'letter_l', 'letter_m', 'letter_n', 'letter_o', 'letter_p', 'letter_q', 'letter_r', 'letter_s', 'letter_t', 'letter_u', 'letter_v', 'letter_w', 'letter_x', 'letter_y', 'letter_z']

  const letterPatternsInGame = games.filter(game => possibleLetterPatterns.includes(game.patternCode))
  if (letterPatternsInGame.length > 1) {
    const letterNames = letterPatternsInGame.map(g => g.patternName).join(', ')
    issues.push(`Multiple letter patterns found: ${letterNames}. Only one letter pattern is allowed per session.`)
  }

  // Check arrow patterns
  const possibleArrowPatterns = games.filter(game =>
    game.patternCode.includes('arrow') || game.patternName.toLowerCase().includes('arrow')
  )
  if (possibleArrowPatterns.length > 1) {
    const arrowNames = possibleArrowPatterns.map(g => g.patternName).join(', ')
    issues.push(`Multiple arrow patterns found: ${arrowNames}. Only one arrow pattern is allowed per session.`)
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}