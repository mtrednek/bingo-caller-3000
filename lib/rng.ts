import crypto from 'crypto'

/**
 * Secure Random Number Generator for Bingo calling
 * Uses Node.js crypto module for cryptographically secure randomness
 */
export class SecureRNG {
  private pool: number[] = []
  private used: number[] = []
  private gameId: string
  private startTime: Date
  protected excludedRanges: string[] = []

  constructor(gameId?: string, excludedRanges?: string[]) {
    this.gameId = gameId || crypto.randomUUID()
    this.startTime = new Date()
    this.excludedRanges = excludedRanges || []
    this.reset()
  }

  /**
   * Reset the RNG with a fresh pool of numbers 1-75 (excluding specified ranges)
   */
  reset(): void {
    this.pool = this.getValidNumbers()
    this.used = []
    this.shuffle()
  }

  /**
   * Get all valid numbers based on excluded ranges
   * @returns Array of valid numbers
   */
  protected getValidNumbers(): number[] {
    const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1)

    if (this.excludedRanges.length === 0) {
      return allNumbers
    }

    return allNumbers.filter(num => {
      const letter = SecureRNG.getBingoLetter(num)
      return !this.excludedRanges.includes(letter)
    })
  }

  /**
   * Set the excluded ranges (B, I, N, G, O)
   * @param ranges - Array of BINGO letters to exclude
   */
  setExcludedRanges(ranges: string[]): void {
    this.excludedRanges = ranges
    this.reset()
  }

  /**
   * Get the current excluded ranges
   * @returns Array of excluded BINGO letters
   */
  getExcludedRanges(): string[] {
    return [...this.excludedRanges]
  }

  /**
   * Shuffle the pool using cryptographically secure randomness
   * Uses Fisher-Yates shuffle algorithm with crypto.randomBytes
   */
  private shuffle(): void {
    for (let i = this.pool.length - 1; i > 0; i--) {
      // Generate cryptographically secure random bytes
      const randomBytes = crypto.randomBytes(4)
      const randomValue = randomBytes.readUInt32BE(0)
      const j = randomValue % (i + 1)
      
      // Swap elements
      ;[this.pool[i], this.pool[j]] = [this.pool[j], this.pool[i]]
    }
  }

  /**
   * Draw the next number from the pool
   * @returns The next number (1-75) or null if all numbers have been called
   */
  drawNumber(): number | null {
    if (this.pool.length === 0) return null

    const number = this.pool.pop()!
    this.used.push(number)
    return number
  }

  /**
   * Manually call a specific number (removes it from pool if available)
   * @param number - The specific number to call (1-75)
   * @returns The number if successfully called, null if not available
   */
  callSpecificNumber(number: number): number | null {
    // Validate number is in valid range
    if (number < 1 || number > 75) {
      return null
    }

    // Check if number is in the pool
    const index = this.pool.indexOf(number)
    if (index === -1) {
      // Number has already been called or is excluded
      return null
    }

    // Remove from pool and add to used
    this.pool.splice(index, 1)
    this.used.push(number)
    return number
  }

  /**
   * Peek at the next number without drawing it
   * @returns The next number that would be drawn, or null if pool is empty
   */
  peekNext(): number | null {
    return this.pool.length > 0 ? this.pool[this.pool.length - 1] : null
  }

  /**
   * Get all numbers that have been called
   * @returns Array of called numbers in order
   */
  getCalledNumbers(): number[] {
    return [...this.used]
  }

  /**
   * Get all remaining numbers in the pool
   * @returns Array of remaining numbers (shuffled order)
   */
  getRemainingNumbers(): number[] {
    return [...this.pool]
  }

  /**
   * Get the total count of called numbers
   * @returns Number of calls made
   */
  getCallCount(): number {
    return this.used.length
  }

  /**
   * Get the count of remaining numbers
   * @returns Number of remaining calls
   */
  getRemainingCount(): number {
    return this.pool.length
  }

  /**
   * Validate the integrity of the RNG
   * Ensures all valid numbers are accounted for exactly once
   * @returns True if integrity is valid
   */
  validateIntegrity(): boolean {
    const allNumbers = new Set([...this.pool, ...this.used])
    const validNumbers = this.getValidNumbers()

    // Check that we have exactly the expected number of unique numbers
    if (allNumbers.size !== validNumbers.length) return false

    // Check that all numbers are in valid range 1-75 and not excluded
    const validSet = new Set(validNumbers)
    const hasInvalidNumbers = Array.from(allNumbers).some(n => n < 1 || n > 75 || !validSet.has(n))
    if (hasInvalidNumbers) return false

    return true
  }

  /**
   * Get the BINGO letter for a given number
   * @param number - The bingo number (1-75)
   * @returns The corresponding BINGO letter
   */
  static getBingoLetter(number: number): string {
    if (number >= 1 && number <= 15) return 'B'
    if (number >= 16 && number <= 30) return 'I'
    if (number >= 31 && number <= 45) return 'N'
    if (number >= 46 && number <= 60) return 'G'
    if (number >= 61 && number <= 75) return 'O'
    throw new Error(`Invalid bingo number: ${number}`)
  }

  /**
   * Get the display string for a number (e.g., "B-7", "O-64")
   * @param number - The bingo number (1-75)
   * @returns Formatted display string
   */
  static getDisplayString(number: number): string {
    const letter = SecureRNG.getBingoLetter(number)
    return `${letter}-${number}`
  }

  /**
   * Generate audit log entry for transparency
   * @returns Audit information for the current state
   */
  getAuditInfo() {
    return {
      gameId: this.gameId,
      startTime: this.startTime,
      callCount: this.getCallCount(),
      remainingCount: this.getRemainingCount(),
      integrityValid: this.validateIntegrity(),
      lastCall: this.used.length > 0 ? this.used[this.used.length - 1] : null,
      timestamp: new Date()
    }
  }

  /**
   * Get statistics about the current game
   */
  getStatistics() {
    const calledNumbers = this.getCalledNumbers()
    const letterCounts = {
      B: calledNumbers.filter(n => n >= 1 && n <= 15).length,
      I: calledNumbers.filter(n => n >= 16 && n <= 30).length,
      N: calledNumbers.filter(n => n >= 31 && n <= 45).length,
      G: calledNumbers.filter(n => n >= 46 && n <= 60).length,
      O: calledNumbers.filter(n => n >= 61 && n <= 75).length
    }

    return {
      totalCalls: this.getCallCount(),
      remaining: this.getRemainingCount(),
      letterDistribution: letterCounts,
      percentageComplete: Math.round((this.getCallCount() / 75) * 100),
      gameId: this.gameId,
      startTime: this.startTime
    }
  }

  /**
   * Create a snapshot of the current state for persistence
   */
  serialize(): string {
    return JSON.stringify({
      gameId: this.gameId,
      startTime: this.startTime,
      pool: this.pool,
      used: this.used,
      excludedRanges: this.excludedRanges
    })
  }

  /**
   * Restore RNG from a serialized state
   * @param serializedState - JSON string from serialize()
   */
  static deserialize(serializedState: string): SecureRNG {
    const state = JSON.parse(serializedState)
    const rng = new SecureRNG(state.gameId, state.excludedRanges || [])
    rng.startTime = new Date(state.startTime)
    rng.pool = state.pool
    rng.used = state.used
    return rng
  }
}

/**
 * Global RNG instances manager for multiple concurrent games
 */
export class RNGManager {
  private static instances: Map<string, SecureRNG> = new Map()

  /**
   * Get or create an RNG instance for a game
   * @param gameId - Unique game identifier
   * @returns SecureRNG instance
   */
  static getInstance(gameId: string): SecureRNG {
    if (!this.instances.has(gameId)) {
      this.instances.set(gameId, new SecureRNG(gameId))
    }
    return this.instances.get(gameId)!
  }

  /**
   * Remove an RNG instance when game is complete
   * @param gameId - Game identifier to remove
   */
  static removeInstance(gameId: string): boolean {
    return this.instances.delete(gameId)
  }

  /**
   * Get all active game IDs
   * @returns Array of active game IDs
   */
  static getActiveGames(): string[] {
    return Array.from(this.instances.keys())
  }

  /**
   * Clear all instances (use with caution)
   */
  static clearAll(): void {
    this.instances.clear()
  }
}

/**
 * Utility function to create a new game RNG
 * @param gameId - Optional game ID, will generate one if not provided
 * @param excludedRanges - Optional array of BINGO letters to exclude
 * @returns New SecureRNG instance
 */
export function createGameRNG(gameId?: string, excludedRanges?: string[]): SecureRNG {
  return new SecureRNG(gameId, excludedRanges)
}

/**
 * Utility function to create a pattern-aware game RNG
 * @param gameId - Optional game ID
 * @param pattern - Optional pattern to set immediately
 * @returns New PatternAwareRNG instance
 */
export function createPatternAwareRNG(gameId?: string, pattern?: any): PatternAwareRNG {
  const rng = new PatternAwareRNG(gameId)
  if (pattern) {
    rng.setPattern(pattern)
  }
  return rng
}

/**
 * Pattern-aware RNG that only includes numbers from columns used by the current pattern
 * Extends SecureRNG with pattern optimization
 */
export class PatternAwareRNG extends SecureRNG {
  private currentPattern: any | null = null
  private validNumbers: number[] = []
  private originalPool: number[] = []

  constructor(gameId?: string) {
    super(gameId)
    this.originalPool = Array.from({ length: 75 }, (_, i) => i + 1)
  }

  /**
   * Set the current pattern and update the available number pool
   * @param pattern - The BingoPattern to optimize for
   */
  setPattern(pattern: any): void {
    this.currentPattern = pattern
    
    // Import pattern functions dynamically to avoid circular dependency
    const { isNumberValidForPattern } = require('./patterns')
    
    // Filter numbers to only those used by this pattern
    this.validNumbers = this.originalPool.filter(number => 
      isNumberValidForPattern(number, pattern)
    )
    
    // Reset with filtered numbers
    this.resetWithValidNumbers()
  }

  /**
   * Reset the RNG pool to only contain numbers valid for the current pattern
   */
  private resetWithValidNumbers(): void {
    if (this.validNumbers.length === 0) {
      // Fallback to all numbers if no pattern is set
      this.reset()
      return
    }
    
    // Set pool to only valid numbers for this pattern
    this.pool = [...this.validNumbers]
    this.used = []
    this.shuffle()
  }

  /**
   * Override reset to use pattern-filtered numbers
   */
  reset(): void {
    if (this.currentPattern && this.validNumbers.length > 0) {
      this.resetWithValidNumbers()
    } else {
      // Use parent reset if no pattern is set
      super.reset()
    }
  }

  /**
   * Get information about which columns are being used
   */
  getPatternInfo(): { pattern: any | null, validColumns: string[], totalNumbers: number } {
    if (!this.currentPattern) {
      return { pattern: null, validColumns: ['B', 'I', 'N', 'G', 'O'], totalNumbers: 75 }
    }

    const validColumns: string[] = []
    if (this.validNumbers.some(n => n >= 1 && n <= 15)) validColumns.push('B')
    if (this.validNumbers.some(n => n >= 16 && n <= 30)) validColumns.push('I')
    if (this.validNumbers.some(n => n >= 31 && n <= 45)) validColumns.push('N')
    if (this.validNumbers.some(n => n >= 46 && n <= 60)) validColumns.push('G')
    if (this.validNumbers.some(n => n >= 61 && n <= 75)) validColumns.push('O')

    return {
      pattern: this.currentPattern,
      validColumns,
      totalNumbers: this.validNumbers.length
    }
  }

  /**
   * Clear pattern and return to full 75-number pool
   */
  clearPattern(): void {
    this.currentPattern = null
    this.validNumbers = []
    super.reset()
  }

  /**
   * Override validateIntegrity for pattern-aware validation
   */
  validateIntegrity(): boolean {
    const expectedTotal = this.validNumbers.length > 0 ? this.validNumbers.length : 75
    const allNumbers = new Set([...this.pool, ...this.used])
    
    // Check that we have exactly the expected number of unique numbers
    if (allNumbers.size !== expectedTotal) return false
    
    // If we have a pattern, check that all numbers are valid for that pattern
    if (this.currentPattern && this.validNumbers.length > 0) {
      const validSet = new Set(this.validNumbers)
      const hasInvalidNumbers = Array.from(allNumbers).some(n => !validSet.has(n))
      if (hasInvalidNumbers) return false
    } else {
      // Standard validation for full range
      const hasInvalidNumbers = Array.from(allNumbers).some(n => n < 1 || n > 75)
      if (hasInvalidNumbers) return false
    }
    
    return true
  }
}