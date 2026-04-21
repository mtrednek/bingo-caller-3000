'use client'

import React, { useEffect, useState, use } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PatternVisualizer from '@/components/patterns/PatternVisualizer'
import { cn } from '@/lib/utils'

interface DisplayScreenProps {
  params: Promise<{ sessionId: string }>
}

interface Session {
  id: string
  name: string
  players: number
  duration: number
  packetPrice: number
  sheetsPerPacket: number
  status: string
  games: Array<{
    id: string
    patternType: string
    patternName: string
    prizeValue: number
    patternColor: string
    status: string
    orderIndex: number
    calledNumbers: number[]
    winnerName?: string
    winnerCard?: string
    endTime?: string
  }>
}

interface GameState {
  currentGame: any | null
  lastCall: string
  calledNumbers: number[]
  gameStatus: 'waiting' | 'active' | 'verifying' | 'completed'
  displayMode: 'auto' | 'games-list' | 'current-game'
  forceDisplayMode: boolean
}

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']

interface Joke {
  id: number
  question: string
  answer: string
}

interface SessionJokeData {
  currentJoke: Joke | null
  currentJokeIndex: number
  totalJokes: number
  hasMoreJokes: boolean
}

type WaitingDisplayMode = 'games' | 'joke-question' | 'joke-answer'

export default function DisplayScreen({ params }: DisplayScreenProps) {
  const { sessionId } = use(params)
  const [session, setSession] = useState<Session | null>(null)
  const [patterns, setPatterns] = useState<Record<string, any>>({})
  const [sessionJokeData, setSessionJokeData] = useState<SessionJokeData | null>(null)
  const [waitingDisplayMode, setWaitingDisplayMode] = useState<WaitingDisplayMode>('games')
  const [displayConfig, setDisplayConfig] = useState({
    gamesDisplaySeconds: 16,
    jokeQuestionSeconds: 4,
    jokeAnswerSeconds: 4,
    displayMargin: 0
  })
  const [gameState, setGameState] = useState<GameState>({
    currentGame: null,
    lastCall: '',
    calledNumbers: [],
    gameStatus: 'waiting',
    displayMode: 'auto',
    forceDisplayMode: false
  })
  const [factoids, setFactoids] = useState<Record<string, string[]>>({})
  const [currentFactoid, setCurrentFactoid] = useState<string>('')

  useEffect(() => {
    loadSession()
    loadSessionJokes()
    loadDisplayConfig()
    loadFactoids()

    // Set up polling for updates - reduced frequency to prevent jarring repaints
    const pollInterval = setInterval(loadSession, 3000) // Changed from 1000ms to 3000ms

    return () => {
      clearInterval(pollInterval)
    }
  }, [sessionId])

  // Effect to cycle through waiting display modes
  useEffect(() => {
    // Skip cycling if showFactoids is false
    const showFactoids = (session as any)?.showFactoids !== false
    if (gameState.gameStatus !== 'waiting' || !sessionJokeData?.currentJoke || !showFactoids) {
      // If factoids are disabled, ensure we stay on games view
      if (!showFactoids && waitingDisplayMode !== 'games') {
        setWaitingDisplayMode('games')
      }
      return
    }

    let timeoutId: NodeJS.Timeout

    const cycleDisplay = async () => {
      setWaitingDisplayMode(prev => {
        if (prev === 'games') {
          return 'joke-question'
        } else if (prev === 'joke-question') {
          return 'joke-answer'
        } else {
          // Moving from joke-answer back to games - advance to next joke
          advanceToNextJoke()
          return 'games'
        }
      })
    }

    // Set timeout based on current mode
    const getTimeout = () => {
      switch (waitingDisplayMode) {
        case 'games':
          return displayConfig.gamesDisplaySeconds * 1000
        case 'joke-question':
          return displayConfig.jokeQuestionSeconds * 1000
        case 'joke-answer':
          return displayConfig.jokeAnswerSeconds * 1000
      }
    }

    timeoutId = setTimeout(cycleDisplay, getTimeout())

    return () => clearTimeout(timeoutId)
  }, [waitingDisplayMode, gameState.gameStatus, sessionJokeData, displayConfig, session])

  // Effect to update factoid when last call changes
  useEffect(() => {
    if (!gameState.lastCall || Object.keys(factoids).length === 0) {
      setCurrentFactoid('')
      return
    }

    // Extract numeric portion from last call (e.g., "B-15" -> "15")
    const match = gameState.lastCall.match(/-(\d+)$/)
    if (!match) return

    const number = match[1]
    const factoidsForNumber = factoids[number]

    if (factoidsForNumber && factoidsForNumber.length > 0) {
      // Pick a random factoid from the array
      const randomIndex = Math.floor(Math.random() * factoidsForNumber.length)
      setCurrentFactoid(factoidsForNumber[randomIndex])
    } else {
      setCurrentFactoid('')
    }
  }, [gameState.lastCall, factoids])

  const loadSessionJokes = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/jokes`)
      if (response.ok) {
        const jokeData = await response.json()
        setSessionJokeData(jokeData)
      }
    } catch (error) {
      console.error('Failed to load session jokes:', error)
    }
  }

  const advanceToNextJoke = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/jokes`, {
        method: 'POST'
      })
      if (response.ok) {
        const jokeData = await response.json()
        setSessionJokeData(jokeData)
      }
    } catch (error) {
      console.error('Failed to advance joke:', error)
    }
  }

  const loadDisplayConfig = async () => {
    try {
      const response = await fetch('/api/display-config')
      if (response.ok) {
        const config = await response.json()
        setDisplayConfig({
          gamesDisplaySeconds: config.gamesDisplaySeconds,
          jokeQuestionSeconds: config.jokeQuestionSeconds,
          jokeAnswerSeconds: config.jokeAnswerSeconds,
          displayMargin: config.displayMargin || 0
        })
      }
    } catch (error) {
      console.error('Failed to load display config:', error)
    }
  }

  const loadFactoids = async () => {
    try {
      const response = await fetch('/api/factoids')
      if (response.ok) {
        const data = await response.json()
        setFactoids(data)
      }
    } catch (error) {
      console.error('Failed to load factoids:', error)
    }
  }

  const loadSession = async () => {
    try {
      // Load session data
      const sessionResponse = await fetch(`/api/sessions/${sessionId}`)
      if (!sessionResponse.ok) return

      const sessionData = await sessionResponse.json()

      // Only update session state if data has actually changed
      setSession(prevSession => {
        if (!prevSession || JSON.stringify(prevSession) !== JSON.stringify(sessionData)) {
          return sessionData
        }
        return prevSession
      })

      // Load patterns data from public API (only if we don't have them yet)
      if (Object.keys(patterns).length === 0) {
        try {
          const patternsResponse = await fetch('/api/patterns/public')
          if (patternsResponse.ok) {
            const patternsData = await patternsResponse.json()
            const patternMap = patternsData.reduce((acc: Record<string, any>, pattern: any) => {
              acc[pattern.code] = pattern
              return acc
            }, {})


            // Only update patterns if they've actually changed
            setPatterns(prevPatterns => {
              if (Object.keys(prevPatterns).length === 0 || JSON.stringify(prevPatterns) !== JSON.stringify(patternMap)) {
                return patternMap
              }
              return prevPatterns
            })
          }
        } catch (error) {
          console.error('Failed to load patterns:', error)
        }
      }

      // Load display mode
      const displayModeResponse = await fetch(`/api/sessions/${sessionId}/display-mode`)
      const displayModeData = displayModeResponse.ok ? await displayModeResponse.json() : null

      // Find active game
      const activeGame = sessionData.games.find((game: any) => game.status === 'active')

      setGameState(prevState => {
        const currentDisplayMode = displayModeData?.displayMode || 'auto'
        const isForced = currentDisplayMode !== 'auto'

        let newState = { ...prevState }

        // Handle forced display modes
        if (isForced) {
          if (currentDisplayMode === 'games-list') {
            newState = {
              ...prevState,
              displayMode: currentDisplayMode,
              forceDisplayMode: true,
              currentGame: null,
              gameStatus: 'waiting'
            }
          } else if (currentDisplayMode === 'current-game' && displayModeData?.currentGame) {
            newState = {
              ...prevState,
              displayMode: currentDisplayMode,
              forceDisplayMode: true,
              currentGame: displayModeData.currentGame,
              gameStatus: 'active'
            }
          }
        } else {
          // Auto mode behavior
          if (activeGame) {
            const calledNumbers = Array.isArray(activeGame.calledNumbers)
              ? activeGame.calledNumbers as number[]
              : []

            newState = {
              ...prevState,
              displayMode: 'auto',
              forceDisplayMode: false,
              currentGame: activeGame,
              lastCall: calledNumbers.length > 0
                ? `${getBingoLetter(calledNumbers[calledNumbers.length - 1])}-${calledNumbers[calledNumbers.length - 1]}`
                : '',
              calledNumbers,
              gameStatus: 'active'
            }
          } else {
            // No active game found - show games list (waiting state)
            newState = {
              ...prevState,
              displayMode: 'auto',
              forceDisplayMode: false,
              currentGame: null,
              lastCall: '',
              calledNumbers: [],
              gameStatus: 'waiting'
            }
          }
        }

        // Only update if state has actually changed
        if (JSON.stringify(newState) !== JSON.stringify(prevState)) {
          return newState
        }
        return prevState
      })
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  const getBingoLetter = (number: number): string => {
    if (number <= 15) return 'B'
    if (number <= 30) return 'I'
    if (number <= 45) return 'N'
    if (number <= 60) return 'G'
    return 'O'
  }

  // Separate component for time display to prevent re-renders
  const TimeDisplay = React.memo(() => {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
      const interval = setInterval(() => {
        setTime(new Date())
      }, 1000)

      return () => clearInterval(interval)
    }, [])

    return (
      <div className="text-3xl font-mono text-white bg-white/10 rounded-lg px-4 py-2">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    )
  })

  // Separate component for top bar time display
  const TopBarTime = React.memo(() => {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
      const interval = setInterval(() => {
        setTime(new Date())
      }, 1000)

      return () => clearInterval(interval)
    }, [])

    return (
      <div className="text-lg font-mono">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    )
  })

  // Calculate optimal hue using subdividing color wheel approach
  // This ensures maximum visual distinction by always placing the next color
  // at the point furthest from existing colors
  const getOptimalHue = (winnerIndex: number): number => {
    // Predefined sequence for optimal color spacing:
    // Level 1 (120° apart): 0°, 120°, 240°
    // Level 2 (60° gaps): 60°, 180°, 300° 
    // Level 3 (30° gaps): 30°, 90°, 150°, 210°, 270°, 330°
    // Level 4 (15° gaps): 15°, 45°, 75°, 105°, 135°, 165°, 195°, 225°, 255°, 285°, 315°, 345°

    const optimalHues = [
      // Level 1: Maximum separation (3 colors, 120° apart)
      0, 120, 240,

      // Level 2: Fill the gaps (3 more colors, 60° from nearest)
      60, 180, 300,

      // Level 3: Split remaining gaps (6 more colors, 30° from nearest) 
      30, 90, 150, 210, 270, 330,

      // Level 4: Further subdivision (12 more colors, 15° from nearest)
      15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345,

      // Level 5: Even finer subdivision (24 more colors, 7.5° from nearest)
      7.5, 22.5, 37.5, 52.5, 67.5, 82.5, 97.5, 112.5, 127.5, 142.5, 157.5, 172.5,
      187.5, 202.5, 217.5, 232.5, 247.5, 262.5, 277.5, 292.5, 307.5, 322.5, 337.5, 352.5
    ]

    // Return the hue for this winner index, or fall back to even distribution if we exceed the predefined list
    if (winnerIndex < optimalHues.length) {
      return optimalHues[winnerIndex]
    }

    // Fallback: even distribution for winners beyond our predefined list
    const totalPositions = Math.max(48, winnerIndex + 1)
    return (winnerIndex * 360 / totalPositions) % 360
  }

  // Generate visually distinct colors using subdividing color wheel approach
  // 1st: 0°, 2nd: 120°, 3rd: 240° (120° apart)
  // 4th: 60°, 5th: 180°, 6th: 300° (between previous colors)  
  // 7th: 30°, 8th: 90°, 9th: 150°, etc. (continuing subdivision)
  const getWinnerColor = (winnerName: string): { bg: string, text: string } => {
    if (!session) return { bg: 'hsl(0, 70%, 55%, 0.4)', text: 'text-white' }

    // Get all unique winner names from completed games in order they appear
    // Sort games by orderIndex to ensure consistent color assignment
    const uniqueWinners: string[] = []
    session.games
      .filter(game => game.winnerName && game.status === 'completed')
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .forEach(game => {
        if (!uniqueWinners.includes(game.winnerName!)) {
          uniqueWinners.push(game.winnerName!)
        }
      })

    // Find the index of this winner in the unique winners list
    const winnerIndex = uniqueWinners.indexOf(winnerName)
    if (winnerIndex === -1) {
      // Fallback for edge cases
      return { bg: 'hsl(0, 70%, 55%, 0.4)', text: 'text-white' }
    }

    // Calculate hue using subdividing color wheel approach
    const hue = getOptimalHue(winnerIndex)

    // Use consistent saturation and lightness for visual harmony
    const saturation = 75 // High saturation for vibrant colors
    const lightness = 55  // Medium lightness for good contrast

    return {
      bg: `hsl(${hue}, ${saturation}%, ${lightness}%, 0.4)`, // Low opacity background for pattern visibility
      text: lightness > 55 ? 'text-gray-900' : 'text-white' // Dark text for light colors, white for dark
    }
  }


  const NumberBoard = React.memo(({ calledNumbers }: { calledNumbers: number[] }) => {
    const called = new Set(calledNumbers)

    // Group numbers by BINGO letter
    const bingoColumns = {
      B: Array.from({ length: 15 }, (_, i) => i + 1),
      I: Array.from({ length: 15 }, (_, i) => i + 16),
      N: Array.from({ length: 15 }, (_, i) => i + 31),
      G: Array.from({ length: 15 }, (_, i) => i + 46),
      O: Array.from({ length: 15 }, (_, i) => i + 61)
    }

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 shadow-2xl flex flex-col">
        {/* BINGO Headers */}
        <div className="grid grid-cols-5 gap-2 mb-2 shrink-0">
          {BINGO_LETTERS.map(letter => (
            <div key={letter} className="text-center">
              <div className="text-6xl font-bold text-white bg-blue-600 rounded py-1 shadow-lg">
                {letter}
              </div>
            </div>
          ))}
        </div>

        {/* Numbers Grid - 5 main columns, each with 3 sub-columns of 5 rows */}
        <div className="grid grid-cols-5 gap-2 overflow-hidden max-h-96">
          {BINGO_LETTERS.map((letter) => (
            <div key={letter} className="grid grid-cols-3 gap-1">
              {Array.from({ length: 3 }, (_, subCol) => (
                <div key={subCol} className="grid grid-rows-5 gap-1 max-h-96">
                  {Array.from({ length: 5 }, (_, row) => {
                    const num = bingoColumns[letter as keyof typeof bingoColumns][subCol * 5 + row]
                    const isCalled = called.has(num)

                    return (
                      <div
                        key={num}
                        className={cn(
                          "rounded flex items-center justify-center font-bold text-5xl transition-all duration-500",
                          isCalled
                            ? num === gameState.calledNumbers[gameState.calledNumbers.length - 1]
                              ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white shadow-lg"
                              : "bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-lg"
                            : "bg-white/20 text-white/60 border border-white/30"
                        )}
                        style={{ aspectRatio: '1', maxHeight: '76px', maxWidth: '76px' }}
                      >
                        {num}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  })
  NumberBoard.displayName = 'NumberBoard'

  const PatternDisplay = ({ game, gameIndex }: { game: any, gameIndex: number }) => {
    const pattern = patterns[game.patternType]
    if (!pattern || !session) return null

    const isJackpotGame = gameIndex >= session.games.length - 2 && session.games.length >= 2

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-2.5 shadow-xl text-center flex flex-col">
        <div className="mb-1.5">
          <PatternVisualizer
            key={`pattern-${pattern.code}`}
            pattern={pattern}
            size="xlarge"
            animate={(pattern.canRotate || pattern.canMirror) && pattern.animationDelay ? true : false}
            patternColor={game.patternColor || '#60a5fa'}
          />
        </div>
        <h3 className="text-lg font-bold text-white mb-1.5">{pattern.name}</h3>
        {isJackpotGame && (
          <Badge className="text-sm px-1.5 py-0.5 mb-1.5 bg-gradient-to-r from-yellow-500 to-orange-500">
            🎰 JACKPOT
          </Badge>
        )}
        <p className="text-white/70 text-sm">
          Difficulty: {pattern.difficulty}/5
        </p>
      </div>
    )
  }

  // Game Card Component for reuse in different layouts
  const GameCard = ({ game, index }: { game: any, index: number }) => {
    const pattern = patterns[game.patternType]

    const isJackpotGame = index >= session!.games.length - 2 && session!.games.length >= 2
    const isCompleted = game.status === 'completed'
    const isActive = game.status === 'active'
    const isPending = game.status === 'pending'

    const winnerColors = isCompleted && game.winnerName ? getWinnerColor(game.winnerName) : null

    return (
      <div
        className={cn(
          "relative rounded-lg p-1 py-0.5 hover:scale-105 transition-all duration-300 flex flex-col aspect-[1/0.9] text-xs",
          isCompleted && game.winnerName
            ? "ring-4 shadow-lg"
            : isCompleted && "ring-4 ring-gray-400/80 shadow-gray-400/30 shadow-lg",
          isActive && "ring-4 ring-blue-400/80 shadow-blue-400/30 shadow-lg",
          isJackpotGame
            ? "bg-gradient-to-br from-yellow-500/30 to-orange-500/30 ring-2 ring-yellow-400/50 shadow-yellow-400/20 shadow-lg hover:bg-gradient-to-br hover:from-yellow-500/40 hover:to-orange-500/40"
            : "bg-white/20 hover:bg-white/25"
        )}
        style={winnerColors ? {
          '--tw-ring-color': winnerColors.bg,
          boxShadow: `0 10px 15px -3px ${winnerColors.bg.replace('0.4)', '0.3)')}, 0 4px 6px -2px ${winnerColors.bg.replace('0.4)', '0.1)')}`
        } as React.CSSProperties : {}}
      >
        {/* Winner Overlay */}
        {isCompleted && game.winnerName && winnerColors && (
          <div
            className="absolute inset-0 backdrop-blur-sm rounded-xl flex items-center justify-center z-10"
            style={{ backgroundColor: winnerColors.bg }}
          >
            <div className="text-center px-1">
              {/* Trophy with 40% opacity white circle background */}
              <div className="flex justify-center mb-0.5">
                <div className="bg-white/40 rounded-full w-6 h-6 flex items-center justify-center shadow-lg backdrop-blur-sm">
                  <div className="text-sm">🏆</div>
                </div>
              </div>


              {/* Winner names with 40% opacity dark green pills */}
              <div className="flex flex-wrap justify-center gap-0.5 mb-0.5">
                {game.winnerName.split(/[,&+]|\sand\s/).map((name, idx) => (
                  <div
                    key={idx}
                    className="bg-green-800/40 text-white px-1 py-0.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm"
                    style={{ minWidth: '30px' }}
                  >
                    {name.trim()}
                  </div>
                ))}
              </div>

              {game.winnerCard && (
                <div className={`${winnerColors.text}/80 text-xs mt-1`}>
                  Card: {game.winnerCard}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Game Indicator */}
        {isActive && (
          <div className="absolute inset-0 bg-blue-600/60 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-lg mb-0.5">🎯</div>
              <div className="text-white font-bold text-xs">NOW PLAYING</div>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-1 right-1 z-20">
          {isCompleted && (
            <Badge className="bg-green-600 text-white text-xs px-1 py-0">COMPLETE</Badge>
          )}
          {isActive && (
            <Badge className="bg-blue-600 text-white text-xs px-1 py-0">ACTIVE</Badge>
          )}
          {isPending && (
            <Badge className="bg-gray-600 text-white text-xs px-1 py-0">UPCOMING</Badge>
          )}
        </div>

        <div className="flex justify-center items-start">
          <Badge className={cn(
            "text-xs px-1.5 py-0 font-bold",
            isJackpotGame ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-600"
          )}>
            #{index + 1}
          </Badge>
        </div>

        {isJackpotGame && (
          <Badge className="text-xs px-1.5 py-0 bg-orange-500 hover:bg-orange-600 self-center font-bold">
            🎰 JACKPOT
          </Badge>
        )}

        <h3 className="text-lg font-bold text-white text-center leading-none">
          {game.patternName}
        </h3>

        {pattern && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <PatternVisualizer
              key={`pattern-${pattern.code}`}
              pattern={pattern}
              size="medium"
              animate={(pattern.canRotate || pattern.canMirror) && pattern.animationDelay ? true : false}
              patternColor={game.patternColor || '#60a5fa'}
            />
          </div>
        )}
      </div>
    )
  }

  // Determine what to display based on mode
  const shouldShowGamesList = () => {
    if (gameState.forceDisplayMode) {
      return gameState.displayMode === 'games-list'
    }
    return gameState.gameStatus === 'waiting'
  }

  const shouldShowCurrentGame = () => {
    if (gameState.forceDisplayMode) {
      return gameState.displayMode === 'current-game'
    }
    return gameState.gameStatus === 'active' && gameState.currentGame
  }

  // Joke Question Screen
  const JokeQuestionScreen = () => {
    const currentJoke = sessionJokeData?.currentJoke
    if (!currentJoke) return null

    return (
      <div
        className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 text-white p-4 overflow-hidden transition-all duration-1000"
        style={{ padding: `${displayConfig.displayMargin}px` }}
      >
        {/* Background animation */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navbar-style Header */}
          <div className="bg-black/30 backdrop-blur-md border-b border-white/20 px-6 py-4 mb-6">
            <div className="flex items-start justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                  {session?.name}
                </h1>
              </div>

              <div className="flex justify-center flex-1">
                <div className="bg-pink-600/60 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/20 shadow-2xl">
                  <p className="text-2xl font-bold text-white text-center">😄 Joke #{currentJoke.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <TimeDisplay />
              </div>
            </div>
          </div>

          {/* Joke Question */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-5xl w-full">
              <div className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl rounded-3xl p-12">
                <div className="text-8xl mb-8 text-center">🤔</div>
                <h2 className="text-6xl font-bold text-center text-white leading-tight">
                  {currentJoke.question}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Joke Answer Screen
  const JokeAnswerScreen = () => {
    const currentJoke = sessionJokeData?.currentJoke
    if (!currentJoke) return null

    return (
      <div
        className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 text-white p-4 overflow-hidden transition-all duration-1000"
        style={{ padding: `${displayConfig.displayMargin}px` }}
      >
        {/* Background animation */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navbar-style Header */}
          <div className="bg-black/30 backdrop-blur-md border-b border-white/20 px-6 py-4 mb-6">
            <div className="flex items-start justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-teal-500 bg-clip-text text-transparent">
                  {session?.name}
                </h1>
              </div>

              <div className="flex justify-center flex-1">
                <div className="bg-green-600/60 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/20 shadow-2xl">
                  <p className="text-2xl font-bold text-white text-center">😂 Joke #{currentJoke.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <TimeDisplay />
              </div>
            </div>
          </div>

          {/* Joke with Answer */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-5xl w-full space-y-8">
              <div className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl rounded-3xl p-12">
                <div className="text-6xl mb-6 text-center">🤔</div>
                <h2 className="text-5xl font-bold text-center text-white/90 leading-tight mb-8">
                  {currentJoke.question}
                </h2>
                <div className="border-t-4 border-white/30 my-8"></div>
                <div className="text-7xl mb-6 text-center">😄</div>
                <p className="text-6xl font-bold text-center text-yellow-300 leading-tight">
                  {currentJoke.answer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show joke screens when in waiting mode
  if (shouldShowGamesList() && session) {
    if (waitingDisplayMode === 'joke-question') {
      return <JokeQuestionScreen />
    }

    if (waitingDisplayMode === 'joke-answer') {
      return <JokeAnswerScreen />
    }

    // Show games list (waitingDisplayMode === 'games')
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 overflow-hidden transition-all duration-1000"
        style={{ padding: `${displayConfig.displayMargin}px` }}
      >
        {/* Background animation */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navbar-style Header */}
          <div className="bg-black/30 backdrop-blur-md border-b border-white/20 px-6 py-2 mb-1">
            <div className="flex items-start justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-8">
                {/* Session Name */}
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  {session.name}
                </h1>
              </div>

              {/* Centered Ready Message */}
              <div className="flex justify-center">
                <div className="bg-black/60 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/20 shadow-2xl">
                  {session.games.some(g => g.status === 'completed') ? (
                    <p className="text-2xl font-bold text-white text-center">
                      {session.games.some(g => g.status === 'pending')
                        ? "🎯 Waiting for caller to start next game..."
                        : "🎉 All games completed! Thank you for playing!"
                      }
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-white text-center">🚀 Get ready to play! Games will start shortly...</p>
                  )}
                </div>
              </div>

              {/* Time Display */}
              <div className="flex items-center gap-4">
                <TimeDisplay />
              </div>
            </div>
          </div>

          {/* Games Preview */}
          <div className="flex-1 px-6 py-1">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl h-full">
              <div className="p-2 h-full">
                {/* Dynamic layout based on game count */}
                <div className="flex flex-col gap-0.5 h-full justify-center">
                  {/* Top row: 5 games */}
                  <div className="grid grid-cols-5 gap-3 scale-100 origin-center">
                    {session.games.slice(0, 5).map((game, index) => (
                      <GameCard key={`game-${game.id}-${game.patternType}`} game={game} index={index} />
                    ))}
                  </div>

                  {/* Second row: 5 games (if more than 5 games) */}
                  {session.games.length > 5 && (
                    <div className="grid grid-cols-5 gap-3 scale-100 origin-center">
                      {session.games.slice(5, 10).map((game, index) => (
                        <GameCard key={`game-${game.id}-${game.patternType}`} game={game} index={index + 5} />
                      ))}
                    </div>
                  )}

                  {/* Third row: Handle 13 games (3 centered) or 11-15 games (up to 5) */}
                  {session.games.length > 10 && session.games.length <= 15 && (
                    session.games.length === 13 ? (
                      // For exactly 13 games: center the 3 remaining games
                      <div className="flex justify-center gap-3 scale-100 origin-center">
                        {session.games.slice(10, 13).map((game, index) => (
                          <div key={`game-${game.id}-${game.patternType}`} className="w-[calc(20%-0.6rem)]">
                            <GameCard game={game} index={index + 10} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      // For other counts (11, 12, 14, 15): use grid
                      <div className="grid grid-cols-5 gap-3 scale-100 origin-center">
                        {session.games.slice(10, 15).map((game, index) => (
                          <GameCard key={`game-${game.id}-${game.patternType}`} game={game} index={index + 10} />
                        ))}
                      </div>
                    )
                  )}

                  {/* Additional games beyond 15 in a flexible grid */}
                  {session.games.length > 15 && (
                    <>
                      <div className="grid grid-cols-5 gap-3 scale-100 origin-center">
                        {session.games.slice(10, 15).map((game, index) => (
                          <GameCard key={`game-${game.id}-${game.patternType}`} game={game} index={index + 10} />
                        ))}
                      </div>
                      <div className="grid grid-cols-5 gap-3 scale-90 origin-center">
                        {session.games.slice(15).map((game, index) => (
                          <GameCard key={`game-${game.id}-${game.patternType}`} game={game} index={index + 15} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

        </div>

      </div>
    )
  }

  // Display current game
  if (shouldShowCurrentGame() && gameState.currentGame) {
    return (
      <div
        className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden flex flex-col"
        style={{ padding: `${displayConfig.displayMargin}px` }}
      >
        {/* Background animation */}
        <div className="fixed inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Top Bar - 40px height */}
          <div className="h-10 flex justify-between items-center px-6 bg-black/30 backdrop-blur-md shrink-0">
            <h1 className="text-lg font-bold">{session?.name}</h1>
            <div className="flex items-center gap-4">
              <TopBarTime />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex min-h-0 relative">
            {/* Left side - Pattern Display (1/3 of screen width) */}
            <div className="w-1/3 flex flex-col">
              {/* Pattern Display - full height */}
              <div className="flex-1 pl-4 pr-4 pt-4 flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-3 text-center w-full max-w-lg">Current Pattern</h2>
                <div className="w-full max-w-lg origin-top-left" style={{ transform: 'scale(1.07)' }}>
                  <PatternDisplay
                    game={gameState.currentGame}
                    gameIndex={session?.games.findIndex(g => g.id === gameState.currentGame?.id) || 0}
                  />
                </div>
              </div>
            </div>

            {/* Center - Called Numbers Board (2/3 of screen width) */}
            <div className="w-2/3 p-4 flex flex-col min-h-0">
              <h2 className="text-2xl font-bold text-center mb-2 shrink-0">Called Numbers</h2>
              <div className="flex-1 min-h-0">
                <NumberBoard calledNumbers={gameState.calledNumbers} />
              </div>
            </div>

            {/* Previous Calls and Current Call - Evenly spaced at bottom */}
            <div className="absolute bottom-4 left-0 right-0 px-8 flex items-end justify-around">
              {/* Previous Calls */}
              <div className="flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-3 text-center">Previous Calls</h3>
                <div className="flex items-center justify-center gap-6">
                  {/* Third previous (smallest - 243px = 162px * 1.5) */}
                  {gameState.calledNumbers.length >= 4 && (
                    <div className="rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg" style={{ width: '243px', height: '243px' }}>
                      <div className="text-5xl font-bold text-white">
                        {`${getBingoLetter(gameState.calledNumbers[gameState.calledNumbers.length - 4])}-${gameState.calledNumbers[gameState.calledNumbers.length - 4]}`}
                      </div>
                    </div>
                  )}
                  {/* Second previous (medium - 270px = 180px * 1.5) */}
                  {gameState.calledNumbers.length >= 3 && (
                    <div className="rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg" style={{ width: '270px', height: '270px' }}>
                      <div className="text-6xl font-bold text-white">
                        {`${getBingoLetter(gameState.calledNumbers[gameState.calledNumbers.length - 3])}-${gameState.calledNumbers[gameState.calledNumbers.length - 3]}`}
                      </div>
                    </div>
                  )}
                  {/* Most recent previous (largest - 300px = 200px * 1.5) */}
                  {gameState.calledNumbers.length >= 2 && (
                    <div className="rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg" style={{ width: '300px', height: '300px' }}>
                      <div className="text-7xl font-bold text-white">
                        {`${getBingoLetter(gameState.calledNumbers[gameState.calledNumbers.length - 2])}-${gameState.calledNumbers[gameState.calledNumbers.length - 2]}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Call */}
              <div className="flex flex-col items-center">
                <h3 className="text-2xl font-bold text-white mb-3">Current Call</h3>
                {/* Current ball (larger) */}
                <div className="rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl" style={{ width: '368px', height: '368px' }}>
                  <div className="text-center">
                    <div className="text-8xl font-black text-white drop-shadow-2xl">
                      {gameState.lastCall || '?'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar - 40px height */}
          <div className="h-10 bg-black/30 backdrop-blur-md px-6 flex items-center shrink-0">
            <span className="text-white/80 shrink-0 mr-4">
              Call #{gameState.calledNumbers.length} • {75 - gameState.calledNumbers.length} left • {Math.round((gameState.calledNumbers.length / 75) * 100)}% Complete
            </span>
            <div className="flex-1 bg-white/20 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(gameState.calledNumbers.length / 75) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>
    )
  }

  // Loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-32 h-32 border-4 border-white/30 border-t-white rounded-full animate-spin mb-8"></div>
        <div className="text-2xl text-white">Loading Bingo Session...</div>
      </div>
    </div>
  )
}