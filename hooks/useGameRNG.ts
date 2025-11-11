import { useState, useEffect, useCallback } from 'react'
import { SecureRNG, PatternAwareRNG, RNGManager } from '@/lib/rng'
import { BingoPattern } from '@/lib/patterns'

interface GameRNGState {
  rng: SecureRNG | PatternAwareRNG | null
  calledNumbers: number[]
  lastCall: number | null
  lastCallDisplay: string | null
  remainingCount: number
  callCount: number
  isGameActive: boolean
  currentPattern: BingoPattern | null
  validColumns: string[]
  totalAvailableNumbers: number
}

interface GameRNGActions {
  initializeGame: (gameId: string, usePatternAware?: boolean, excludedRanges?: string[]) => void
  setPattern: (pattern: BingoPattern | null) => void
  callNumber: () => number | null
  callSpecificNumber: (number: number) => number | null
  resetGame: () => void
  endGame: () => void
  getStatistics: () => any
}

export function useGameRNG(gameId?: string): [GameRNGState, GameRNGActions] {
  const [state, setState] = useState<GameRNGState>({
    rng: null,
    calledNumbers: [],
    lastCall: null,
    lastCallDisplay: null,
    remainingCount: 75,
    callCount: 0,
    isGameActive: false,
    currentPattern: null,
    validColumns: ['B', 'I', 'N', 'G', 'O'],
    totalAvailableNumbers: 75
  })

  const updateState = useCallback((rng: SecureRNG | PatternAwareRNG) => {
    const calledNumbers = rng.getCalledNumbers()
    const lastCall = calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null
    
    // Get pattern info if it's a PatternAwareRNG
    let patternInfo = { pattern: null, validColumns: ['B', 'I', 'N', 'G', 'O'], totalNumbers: 75 }
    if (rng instanceof PatternAwareRNG) {
      patternInfo = rng.getPatternInfo()
    }
    
    setState(prev => ({
      ...prev,
      rng,
      calledNumbers,
      lastCall,
      lastCallDisplay: lastCall ? SecureRNG.getDisplayString(lastCall) : null,
      remainingCount: rng.getRemainingCount(),
      callCount: rng.getCallCount(),
      isGameActive: rng.getRemainingCount() > 0,
      currentPattern: patternInfo.pattern,
      validColumns: patternInfo.validColumns,
      totalAvailableNumbers: patternInfo.totalNumbers
    }))
  }, [])

  const initializeGame = useCallback((gameId: string, usePatternAware: boolean = false, excludedRanges?: string[]) => {
    let rng: SecureRNG | PatternAwareRNG

    if (usePatternAware) {
      rng = new PatternAwareRNG(gameId)
    } else {
      // Create a new RNG with excluded ranges
      rng = new SecureRNG(gameId, excludedRanges)
      // Register it with the manager
      RNGManager.getInstance(gameId) // This ensures it's registered if needed
    }

    rng.reset() // Ensure fresh start
    updateState(rng)
  }, [updateState])

  const setPattern = useCallback((pattern: BingoPattern | null) => {
    if (!state.rng) return
    
    if (state.rng instanceof PatternAwareRNG) {
      if (pattern) {
        state.rng.setPattern(pattern)
      } else {
        state.rng.clearPattern()
      }
      updateState(state.rng)
    }
  }, [state.rng, updateState])

  const callNumber = useCallback((): number | null => {
    if (!state.rng) return null

    const number = state.rng.drawNumber()
    if (number !== null) {
      updateState(state.rng)
    }

    return number
  }, [state.rng, updateState])

  const callSpecificNumber = useCallback((number: number): number | null => {
    if (!state.rng) return null

    const calledNumber = state.rng.callSpecificNumber(number)
    if (calledNumber !== null) {
      updateState(state.rng)
    }

    return calledNumber
  }, [state.rng, updateState])

  const resetGame = useCallback(() => {
    if (!state.rng) return
    
    state.rng.reset()
    updateState(state.rng)
  }, [state.rng, updateState])

  const endGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      isGameActive: false
    }))
  }, [])

  const getStatistics = useCallback(() => {
    if (!state.rng) return null
    
    return state.rng.getStatistics()
  }, [state.rng])

  // Auto-initialize if gameId is provided
  useEffect(() => {
    if (gameId && !state.rng) {
      initializeGame(gameId)
    }
  }, [gameId, state.rng, initializeGame])

  const actions: GameRNGActions = {
    initializeGame,
    setPattern,
    callNumber,
    callSpecificNumber,
    resetGame,
    endGame,
    getStatistics
  }

  return [state, actions]
}

// Hook for auto-calling numbers at intervals
export function useAutoCall(
  callNumber: () => number | null,
  intervalSeconds: number = 10,
  isActive: boolean = false
) {
  const [autoCallEnabled, setAutoCallEnabled] = useState(false)

  useEffect(() => {
    if (!autoCallEnabled || !isActive) return

    const interval = setInterval(() => {
      const number = callNumber()
      if (number === null) {
        setAutoCallEnabled(false) // Stop auto-calling when game ends
      }
    }, intervalSeconds * 1000)

    return () => clearInterval(interval)
  }, [autoCallEnabled, isActive, callNumber, intervalSeconds])

  return [autoCallEnabled, setAutoCallEnabled] as const
}