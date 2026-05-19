// Pure session-metrics computation. Reads only from the existing
// Game.calledNumbers JSON arrays — no schema change required.

export interface MetricGame {
  id: string
  orderIndex: number
  patternName: string
  prizeValue: number
  status: string
  winnerName: string | null
  startTime: Date | string | null
  endTime: Date | string | null
  calledNumbers: number[]
}

export function getBingoLetter(n: number): 'B' | 'I' | 'N' | 'G' | 'O' {
  if (n <= 15) return 'B'
  if (n <= 30) return 'I'
  if (n <= 45) return 'N'
  if (n <= 60) return 'G'
  return 'O'
}

export interface SessionMetrics {
  totalGames: number
  completedGames: number
  totalCalls: number
  averageCallsPerGame: number | null
  uniqueNumbersCalled: number
  neverCalled: number[]
  calledInEveryGame: number[]
  hottestNumbers: { numbers: number[]; count: number } | null
  coldestCalledNumbers: { numbers: number[]; count: number } | null
  firstCall: { number: number; gameOrderIndex: number; patternName: string } | null
  lastCall: { number: number; gameOrderIndex: number; patternName: string } | null
  letterDistribution: Array<{ letter: 'B' | 'I' | 'N' | 'G' | 'O'; count: number }>
  hottestLetter: 'B' | 'I' | 'N' | 'G' | 'O' | null
  coldestLetter: 'B' | 'I' | 'N' | 'G' | 'O' | null
  evenCount: number
  oddCount: number
  shortestGame: { gameOrderIndex: number; patternName: string; calls: number } | null
  longestGame: { gameOrderIndex: number; patternName: string; calls: number } | null
  perGame: Array<{
    gameOrderIndex: number
    patternName: string
    prizeValue: number
    calls: number
    firstCall: number | null
    winningNumber: number | null
    winnerName: string | null
  }>
}

export function computeSessionMetrics(rawGames: MetricGame[]): SessionMetrics {
  const games = [...rawGames].sort((a, b) => a.orderIndex - b.orderIndex)

  const frequency = new Map<number, number>() // number -> total times called
  const perGameSets: Array<Set<number>> = []

  let totalCalls = 0
  let firstCall: SessionMetrics['firstCall'] = null
  let lastCall: SessionMetrics['lastCall'] = null

  for (const g of games) {
    const calls = Array.isArray(g.calledNumbers) ? g.calledNumbers : []
    perGameSets.push(new Set(calls))

    if (calls.length > 0) {
      if (firstCall === null) {
        firstCall = { number: calls[0], gameOrderIndex: g.orderIndex, patternName: g.patternName }
      }
      lastCall = {
        number: calls[calls.length - 1],
        gameOrderIndex: g.orderIndex,
        patternName: g.patternName,
      }
    }

    for (const n of calls) {
      frequency.set(n, (frequency.get(n) ?? 0) + 1)
      totalCalls += 1
    }
  }

  const neverCalled: number[] = []
  for (let n = 1; n <= 75; n += 1) {
    if (!frequency.has(n)) neverCalled.push(n)
  }

  // Called in every game (only meaningful when there is at least one game with calls)
  const calledInEveryGame: number[] = []
  if (perGameSets.length > 0 && perGameSets.every((s) => s.size > 0)) {
    for (let n = 1; n <= 75; n += 1) {
      if (perGameSets.every((s) => s.has(n))) calledInEveryGame.push(n)
    }
  }

  // Hottest / coldest among numbers that were called
  let hottestNumbers: SessionMetrics['hottestNumbers'] = null
  let coldestCalledNumbers: SessionMetrics['coldestCalledNumbers'] = null
  if (frequency.size > 0) {
    let max = -Infinity
    let min = Infinity
    for (const c of frequency.values()) {
      if (c > max) max = c
      if (c < min) min = c
    }
    const maxNums: number[] = []
    const minNums: number[] = []
    for (const [n, c] of frequency.entries()) {
      if (c === max) maxNums.push(n)
      if (c === min) minNums.push(n)
    }
    maxNums.sort((a, b) => a - b)
    minNums.sort((a, b) => a - b)
    hottestNumbers = { numbers: maxNums, count: max }
    coldestCalledNumbers = { numbers: minNums, count: min }
  }

  // Letter distribution
  const letterTotals: Record<'B' | 'I' | 'N' | 'G' | 'O', number> = {
    B: 0,
    I: 0,
    N: 0,
    G: 0,
    O: 0,
  }
  let evenCount = 0
  let oddCount = 0
  for (const [n, c] of frequency.entries()) {
    letterTotals[getBingoLetter(n)] += c
    if (n % 2 === 0) evenCount += c
    else oddCount += c
  }
  const letterDistribution = (Object.keys(letterTotals) as Array<'B' | 'I' | 'N' | 'G' | 'O'>).map(
    (letter) => ({ letter, count: letterTotals[letter] }),
  )
  let hottestLetter: SessionMetrics['hottestLetter'] = null
  let coldestLetter: SessionMetrics['coldestLetter'] = null
  if (totalCalls > 0) {
    hottestLetter = letterDistribution.reduce((a, b) => (b.count > a.count ? b : a)).letter
    coldestLetter = letterDistribution.reduce((a, b) => (b.count < a.count ? b : a)).letter
  }

  // Per-game summary, plus shortest / longest
  const perGame = games.map((g) => {
    const calls = Array.isArray(g.calledNumbers) ? g.calledNumbers : []
    return {
      gameOrderIndex: g.orderIndex,
      patternName: g.patternName,
      prizeValue: g.prizeValue,
      calls: calls.length,
      firstCall: calls[0] ?? null,
      winningNumber: calls[calls.length - 1] ?? null,
      winnerName: g.winnerName ?? null,
    }
  })

  const playedGames = perGame.filter((p) => p.calls > 0)
  let shortestGame: SessionMetrics['shortestGame'] = null
  let longestGame: SessionMetrics['longestGame'] = null
  if (playedGames.length > 0) {
    const minCalls = Math.min(...playedGames.map((p) => p.calls))
    const maxCalls = Math.max(...playedGames.map((p) => p.calls))
    const minG = playedGames.find((p) => p.calls === minCalls)!
    const maxG = playedGames.find((p) => p.calls === maxCalls)!
    shortestGame = { gameOrderIndex: minG.gameOrderIndex, patternName: minG.patternName, calls: minG.calls }
    longestGame = { gameOrderIndex: maxG.gameOrderIndex, patternName: maxG.patternName, calls: maxG.calls }
  }

  return {
    totalGames: games.length,
    completedGames: games.filter((g) => g.status === 'completed').length,
    totalCalls,
    averageCallsPerGame: playedGames.length > 0 ? totalCalls / playedGames.length : null,
    uniqueNumbersCalled: frequency.size,
    neverCalled,
    calledInEveryGame,
    hottestNumbers,
    coldestCalledNumbers,
    firstCall,
    lastCall,
    letterDistribution,
    hottestLetter,
    coldestLetter,
    evenCount,
    oddCount,
    shortestGame,
    longestGame,
    perGame,
  }
}
