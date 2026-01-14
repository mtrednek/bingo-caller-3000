'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { useGameRNG, useAutoCall } from '@/hooks/useGameRNG'
import PatternVisualizer from '@/components/patterns/PatternVisualizer'
// Patterns will be fetched from the database via API
import { Play, RotateCcw, CheckCircle, Settings, AlertCircle, Eye, PlayCircle, PauseCircle, HelpCircle, X, Keyboard } from 'lucide-react'

interface GameControlProps {
  params: Promise<{ sessionId: string }>
}

interface Session {
  id: string
  name: string
  players: number
  duration: number
  patternColor: string
  status: string
  startTime?: string
  singlePackets: number
  doublePackets: number
  singlePacketPrice: number
  doublePacketPrice: number
  operatingCost: number
  operatingCostType: 'player' | 'packet'
  games: Array<{
    id: string
    patternType: string
    patternName: string
    prizeValue: number
    patternColor: string
    status: string
    orderIndex: number
    excludedRanges?: string[]
  }>
}

interface EditPlayersForm {
  players: number
  singlePackets: number
  doublePackets: number
  singlePacketPrice: number
  doublePacketPrice: number
  operatingCost: number
  operatingCostType: 'player' | 'packet'
}

interface Winner {
  name: string
  card: string
  timestamp: Date
}

export default function GameControl({ params }: GameControlProps) {
  const { sessionId } = use(params)
  const { toast } = useToast()
  const [session, setSession] = useState<Session | null>(null)
  const [patterns, setPatterns] = useState<Record<string, any>>({})
  const [currentGameIndex, setCurrentGameIndex] = useState(0)
  const [gameState, gameActions] = useGameRNG()
  const [autoCallEnabled, setAutoCallEnabled] = useAutoCall(
    gameActions.callNumber,
    10, // 10 seconds interval
    gameState.isGameActive
  )
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false)
  const [winner, setWinner] = useState<Winner>({ name: 'Winner', card: '', timestamp: new Date() })
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [displayMode, setDisplayMode] = useState<'auto' | 'games-list' | 'current-game'>('auto')
  const [sessionPaused, setSessionPaused] = useState(false)
  const [editPlayersDialogOpen, setEditPlayersDialogOpen] = useState(false)
  const [editPlayersForm, setEditPlayersForm] = useState<EditPlayersForm>({
    players: 15,
    singlePackets: 1,
    doublePackets: 15,
    singlePacketPrice: 10.00,
    doublePacketPrice: 16.00,
    operatingCost: 1.00,
    operatingCostType: 'player'
  })
  const [showNextGameButton, setShowNextGameButton] = useState(false)
  const [lastCompletedGameIndex, setLastCompletedGameIndex] = useState(-1)
  const [manualNumberInput, setManualNumberInput] = useState('')
  const [showQuickStartGuide, setShowQuickStartGuide] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [tipsEnabled, setTipsEnabled] = useState(true)

  useEffect(() => {
    loadSession()

    // Poll for session updates every 2 seconds
    const pollInterval = setInterval(loadSession, 2000)

    return () => clearInterval(pollInterval)
  }, [sessionId])

  // Timer for session duration
  useEffect(() => {
    if (!sessionStartTime) return

    // Stop timer if session is completed
    if (session?.status === 'completed') return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const start = sessionStartTime.getTime()
      setElapsedTime(Math.floor((now - start) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionStartTime, session?.status])

  // Disable auto-call when session is paused
  useEffect(() => {
    if (sessionPaused && autoCallEnabled) {
      setAutoCallEnabled(false)
    }
  }, [sessionPaused, autoCallEnabled, setAutoCallEnabled])

  // Load tips preference from localStorage
  useEffect(() => {
    const tipsPreference = localStorage.getItem('bingo-tips-enabled')
    if (tipsPreference !== null) {
      setTipsEnabled(tipsPreference === 'true')
    }

    // Show quick start guide on first visit
    const hasSeenGuide = localStorage.getItem('bingo-has-seen-guide')
    if (!hasSeenGuide) {
      setShowQuickStartGuide(true)
    }
  }, [])

  // Save tips preference to localStorage
  useEffect(() => {
    localStorage.setItem('bingo-tips-enabled', String(tipsEnabled))
  }, [tipsEnabled])

  const dismissQuickStartGuide = () => {
    setShowQuickStartGuide(false)
    localStorage.setItem('bingo-has-seen-guide', 'true')
  }

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)
      if (response.ok) {
        const sessionData = await response.json()
        setSession(sessionData)

        // Load patterns if we don't have them yet
        if (Object.keys(patterns).length === 0) {
          try {
            const patternsResponse = await fetch('/api/patterns')
            if (patternsResponse.ok) {
              const patternsData = await patternsResponse.json()
              const patternMap = patternsData.reduce((acc: Record<string, any>, pattern: any) => {
                acc[pattern.code] = pattern
                return acc
              }, {})
              setPatterns(patternMap)
            }
          } catch (error) {
            console.error('Failed to load patterns:', error)
          }
        }

        // Sync session paused state
        setSessionPaused(sessionData.status === 'paused')

        // Set session start time if it exists in the database
        if (sessionData.startTime && !sessionStartTime) {
          setSessionStartTime(new Date(sessionData.startTime))
        }

        // Preserve next game button state if we just completed a game
        // Only reset the button state if we know a game is now active
        if (gameState.isGameActive) {
          // If a game is active, hide the next game button
          if (showNextGameButton) {
            console.log('loadSession - hiding next game button because game is active')
            setShowNextGameButton(false)
            setLastCompletedGameIndex(-1)
          }
        } else if (lastCompletedGameIndex >= 0) {
          // Only manage button state if we have a completed game tracked
          const hasNextGame = lastCompletedGameIndex + 1 < sessionData.games.length
          const nextGame = hasNextGame ? sessionData.games[lastCompletedGameIndex + 1] : null

          console.log('loadSession - checking to preserve button state:', {
            lastCompletedGameIndex,
            isGameActive: gameState.isGameActive,
            hasNextGame,
            nextGameStatus: nextGame?.status,
            showNextGameButton
          })

          if (hasNextGame && nextGame?.status === 'pending') {
            if (!showNextGameButton) {
              console.log('loadSession - setting showNextGameButton = true')
              setShowNextGameButton(true)
            }
          } else {
            console.log('loadSession - clearing button state - no valid next game')
            setShowNextGameButton(false)
            setLastCompletedGameIndex(-1)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  const startGame = async (gameIndex: number) => {
    if (!session || !session.games[gameIndex]) return

    const game = session.games[gameIndex]

    try {
      const response = await fetch(`/api/games/${game.id}/start`, {
        method: 'POST'
      })

      if (response.ok) {
        // Initialize the RNG with excluded ranges from the game
        const excludedRanges = Array.isArray(game.excludedRanges) ? game.excludedRanges as string[] : []
        gameActions.initializeGame(game.id, false, excludedRanges)
        setCurrentGameIndex(gameIndex)
        setShowNextGameButton(false) // Hide next game button when starting any game
        setLastCompletedGameIndex(-1) // Reset completed game tracking

        // Set session start time if this is the first game
        if (!sessionStartTime && !session.startTime) {
          const startTime = new Date()
          setSessionStartTime(startTime)

          // Update session start time in database
          try {
            await fetch(`/api/sessions/${sessionId}/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ startTime: startTime.toISOString() })
            })
          } catch (error) {
            console.error('Failed to update session start time:', error)
          }
        }

        // Switch display to show the current game
        await setDisplayModeAndBroadcast('current-game')

        toast({
          title: "Game Started",
          description: `${game.patternName} has been started successfully`,
          variant: "default"
        })
      } else {
        toast({
          title: "Failed to Start Game",
          description: "Could not start the game. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to start game:', error)
      toast({
        title: "Error",
        description: "Failed to start game. Please check your connection.",
        variant: "destructive"
      })
    }
  }

  const callNumber = async () => {
    const number = gameActions.callNumber()
    if (!number || !session) return

    const game = session.games[currentGameIndex]
    if (!game) return

    try {
      await fetch(`/api/games/${game.id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number,
          display: `${getBingoLetter(number)}-${number}`
        })
      })
    } catch (error) {
      console.error('Failed to record call:', error)
    }
  }

  const callManualNumber = async () => {
    if (!manualNumberInput || !session) return

    const number = parseInt(manualNumberInput, 10)

    // Validate number range
    if (isNaN(number) || number < 1 || number > 75) {
      toast({
        title: "Invalid Number",
        description: "Please enter a number between 1 and 75",
        variant: "destructive"
      })
      return
    }

    // Check if number has already been called
    if (gameState.calledNumbers.includes(number)) {
      toast({
        title: "Already Called",
        description: `${getBingoLetter(number)}-${number} has already been called`,
        variant: "destructive"
      })
      return
    }

    const game = session.games[currentGameIndex]
    if (!game) return

    // Check if number is in the excluded ranges
    if (game && Array.isArray(game.excludedRanges) && game.excludedRanges.length > 0) {
      const letter = getBingoLetter(number)
      if (game.excludedRanges.includes(letter)) {
        toast({
          title: "Excluded Number",
          description: `${letter}-${number} is excluded for this game (${game.excludedRanges.join(', ')} ranges are excluded)`,
          variant: "destructive"
        })
        return
      }
    }

    try {
      // Use the callSpecificNumber method from the RNG
      const calledNumber = gameActions.callSpecificNumber(number)

      if (calledNumber === null) {
        toast({
          title: "Invalid Number",
          description: `${getBingoLetter(number)}-${number} is not available in the current pool`,
          variant: "destructive"
        })
        return
      }

      // Record the call in the database
      await fetch(`/api/games/${game.id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: calledNumber,
          display: `${getBingoLetter(calledNumber)}-${calledNumber}`
        })
      })

      // Clear the input
      setManualNumberInput('')

      toast({
        title: "Number Called",
        description: `Successfully called ${getBingoLetter(calledNumber)}-${calledNumber}`,
        variant: "default"
      })
    } catch (error) {
      console.error('Failed to call manual number:', error)
      toast({
        title: "Error",
        description: "Failed to call number. Please try again.",
        variant: "destructive"
      })
    }
  }

  const setDisplayModeAndBroadcast = async (mode: 'auto' | 'games-list' | 'current-game') => {
    setDisplayMode(mode)

    try {
      const response = await fetch(`/api/sessions/${sessionId}/display-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayMode: mode,
          currentGame: mode === 'current-game' && session ? session.games[currentGameIndex] : null
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update display mode: ${response.status}`)
      }

      await response.json()

      toast({
        title: "Display Mode Updated",
        description: `Display switched to ${mode === 'auto' ? 'automatic mode' : mode === 'games-list' ? 'games list' : 'current game'}`,
        variant: "default"
      })
    } catch (error) {
      console.error('Failed to update display mode:', error)

      let errorMessage = 'Failed to update display mode'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const getBingoLetter = (number: number): string => {
    if (number <= 15) return 'B'
    if (number <= 30) return 'I'
    if (number <= 45) return 'N'
    if (number <= 60) return 'G'
    return 'O'
  }

  const verifyWinner = () => {
    setWinner({ name: 'Winner', card: '', timestamp: new Date() })
    setWinnerDialogOpen(true)
  }

  const confirmWinner = async () => {
    if (!winner.name.trim()) {
      toast({
        title: "Winner Name Required",
        description: "Please enter the winner's name",
        variant: "destructive"
      })
      return
    }

    if (!session) return
    const game = session.games[currentGameIndex]
    if (!game) return

    try {
      await fetch(`/api/games/${game.id}/winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerName: winner.name,
          winnerCard: winner.card,
          calledNumbers: gameState.calledNumbers
        })
      })

      setWinnerDialogOpen(false)
      setWinner({ name: 'Winner', card: '', timestamp: new Date() })
      gameActions.endGame()

      // Force display back to games list overview
      await setDisplayModeAndBroadcast('games-list')

      // Small delay to ensure state has updated before showing next game logic
      await new Promise(resolve => setTimeout(resolve, 100))

      // Show next game button if there are more games
      const hasNextGame = currentGameIndex + 1 < session.games.length
      const nextGame = hasNextGame ? session.games[currentGameIndex + 1] : null

      console.log('Winner confirmed - checking next game:', {
        hasNextGame,
        currentGameIndex,
        totalGames: session.games.length,
        nextGameStatus: nextGame?.status,
        nextGameName: nextGame?.patternName
      })

      if (hasNextGame && nextGame?.status === 'pending') {
        console.log('Setting showNextGameButton to true and lastCompletedGameIndex to', currentGameIndex)
        // Use a small delay to ensure the game state has settled
        setTimeout(() => {
          setShowNextGameButton(true)
          setLastCompletedGameIndex(currentGameIndex)
        }, 100)
      } else {
        console.log('Not showing next game button - conditions not met')
      }

      toast({
        title: "Winner Recorded",
        description: `${winner.name} has been recorded as the winner!${hasNextGame ? ' Ready for next game.' : ' All games completed!'}`,
        variant: "default"
      })
    } catch (error) {
      console.error('Failed to record winner:', error)
      toast({
        title: "Error",
        description: "Failed to record winner. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleResetGame = () => {
    setShowResetDialog(true)
  }

  const confirmResetGame = async () => {
    gameActions.resetGame()
    setShowResetDialog(false)

    // Force display back to games list overview
    await setDisplayModeAndBroadcast('games-list')

    toast({
      title: "Game Reset",
      description: "Current game has been reset successfully",
      variant: "default"
    })
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatSessionDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}`
  }

  const pauseSession = async () => {
    try {
      const newStatus = sessionPaused ? 'active' : 'paused'
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setSessionPaused(!sessionPaused)
        toast({
          title: sessionPaused ? "Session Resumed" : "Session Paused",
          description: sessionPaused ? "Session has been resumed" : "Session has been paused",
          variant: "default"
        })
      } else {
        throw new Error('Failed to update session status')
      }
    } catch (error) {
      console.error('Failed to pause/resume session:', error)
      toast({
        title: "Error",
        description: "Failed to update session status",
        variant: "destructive"
      })
    }
  }

  const openEditPlayersDialog = () => {
    if (session) {
      setEditPlayersForm({
        players: session.players,
        singlePackets: session.singlePackets || 15,
        doublePackets: session.doublePackets || 0,
        singlePacketPrice: session.singlePacketPrice || 10.00,
        doublePacketPrice: session.doublePacketPrice || 16.00,
        operatingCost: session.operatingCost || 1.00,
        operatingCostType: session.operatingCostType || 'player'
      })
    }
    setEditPlayersDialogOpen(true)
  }

  const updatePlayers = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: editPlayersForm.players,
          singlePackets: editPlayersForm.singlePackets,
          doublePackets: editPlayersForm.doublePackets,
          singlePacketPrice: editPlayersForm.singlePacketPrice,
          doublePacketPrice: editPlayersForm.doublePacketPrice,
          operatingCost: editPlayersForm.operatingCost,
          operatingCostType: editPlayersForm.operatingCostType,
          recalculatePrizes: true  // Always recalculate prizes when configuration changes
        })
      })

      if (response.ok) {
        await loadSession()
        setEditPlayersDialogOpen(false)

        toast({
          title: "Configuration Updated Successfully",
          description: `Updated to ${editPlayersForm.players} players, ${editPlayersForm.singlePackets} single packets, ${editPlayersForm.doublePackets} double packets. Game prizes have been recalculated.`,
          variant: "default"
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update configuration')
      }
    } catch (error) {
      console.error('Failed to update configuration:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update configuration. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getCurrentGame = () => {
    return session?.games[currentGameIndex] || null
  }

  const getCurrentPattern = () => {
    const game = getCurrentGame()
    return game ? patterns[game.patternType] || null : null
  }

  const startNextGame = async () => {
    const nextGameIndex = lastCompletedGameIndex + 1
    if (!session || nextGameIndex >= session.games.length) return

    const nextGame = session.games[nextGameIndex]
    if (nextGame.status !== 'pending') return

    setShowNextGameButton(false)
    setLastCompletedGameIndex(-1)
    await startGame(nextGameIndex)
  }

  // Keyboard shortcuts - placed after function definitions
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Don't trigger if session is paused
      if (sessionPaused) return

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'spacebar':
          e.preventDefault()
          if (gameState.isGameActive) {
            callNumber()
          }
          break
        case 'v':
          if (gameState.isGameActive) {
            verifyWinner()
          }
          break
        case 'r':
          if (gameState.isGameActive) {
            handleResetGame()
          }
          break
        case 'a':
          if (gameState.isGameActive) {
            setAutoCallEnabled(prev => !prev)
          }
          break
        case '?':
          setShowKeyboardShortcuts(true)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState.isGameActive, sessionPaused])

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg">Loading session...</div>
      </div>
    )
  }

  const currentGame = getCurrentGame()
  const currentPattern = getCurrentPattern()

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Quick Start Guide - First Time Users */}
        {showQuickStartGuide && (
          <Card className="border-blue-500 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-blue-900">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  <span>Welcome to Bingo Caller 3000!</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissQuickStartGuide}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-blue-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Getting Started
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Click a game from the list to start calling</li>
                    <li>Use "Call Number" or press <kbd className="px-1 py-0.5 bg-white rounded border">Space</kbd> to call numbers</li>
                    <li>When someone wins, press <kbd className="px-1 py-0.5 bg-white rounded border">V</kbd> or click "Verify Win"</li>
                    <li>Enter winner's name and confirm</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Keyboard className="w-4 h-4" />
                    Keyboard Shortcuts
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li><kbd className="px-1 py-0.5 bg-white rounded border">Space</kbd> - Call next number</li>
                    <li><kbd className="px-1 py-0.5 bg-white rounded border">V</kbd> - Verify winner</li>
                    <li><kbd className="px-1 py-0.5 bg-white rounded border">A</kbd> - Toggle auto-call</li>
                    <li><kbd className="px-1 py-0.5 bg-white rounded border">R</kbd> - Reset game</li>
                    <li><kbd className="px-1 py-0.5 bg-white rounded border">?</kbd> - Show all shortcuts</li>
                  </ul>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-300 flex items-center justify-between">
                <div className="text-xs">
                  Press <kbd className="px-1 py-0.5 bg-white rounded border">?</kbd> anytime to see keyboard shortcuts
                </div>
                <Button onClick={dismissQuickStartGuide} size="sm" variant="default">
                  Got it!
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Keyboard Shortcuts Dialog */}
        <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Keyboard Shortcuts
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Game Control</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs font-mono">Space</kbd>
                    <span className="text-gray-600">Call Number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs font-mono">V</kbd>
                    <span className="text-gray-600">Verify Win</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs font-mono">A</kbd>
                    <span className="text-gray-600">Toggle Auto-call</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs font-mono">R</kbd>
                    <span className="text-gray-600">Reset Game</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-semibold text-sm">Help</h4>
                <div className="flex items-center gap-2 text-sm">
                  <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs font-mono">?</kbd>
                  <span className="text-gray-600">Show this dialog</span>
                </div>
              </div>
              <div className="pt-3 border-t text-xs text-gray-500">
                <p>💡 Tip: Shortcuts only work when not typing in text fields</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Session Header */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{session.name}</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKeyboardShortcuts(true)}
                    className="h-8 w-8 p-0"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show keyboard shortcuts (?)</p>
                </TooltipContent>
              </Tooltip>
              <Badge>{session.players} players</Badge>
              {sessionStartTime && (
                <>
                  <Badge variant="outline">
                    Started: {sessionStartTime.toLocaleTimeString()}
                  </Badge>
                  <Badge variant="outline">
                    Elapsed: {formatTime(elapsedTime)}
                  </Badge>
                </>
              )}
              <Badge variant="outline">
                Planned: {formatSessionDuration(session.duration)}
              </Badge>
              <Badge variant={session.status === 'active' ? 'default' : session.status === 'paused' ? 'destructive' : 'secondary'}>
                {session.status}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionPaused && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <div className="text-sm font-medium text-yellow-800">
                  Session is paused - All game activities are disabled until resumed
                </div>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">Financial Summary</h3>

            {/* Packets Row */}
            <div className="mb-4 pb-3 border-b border-blue-300">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{session.singlePackets || 0}</div>
                  <div className="text-sm text-gray-600">Single Packets (${(session.singlePacketPrice || 10).toFixed(2)})</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{session.doublePackets || 0}</div>
                  <div className="text-sm text-gray-600">Double Packets (${(session.doublePacketPrice || 16).toFixed(2)})</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {(session.singlePackets || 0) + (session.doublePackets || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Packets</div>
                </div>
              </div>
            </div>

            {/* Main Financial Stats */}
            <div className="grid grid-cols-5 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">{session.players}</div>
                <div className="text-sm text-gray-600">Players</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${(() => {
                    const totalRevenue = ((session.singlePackets || 0) * (session.singlePacketPrice || 10)) +
                      ((session.doublePackets || 0) * (session.doublePacketPrice || 16))
                    return totalRevenue.toFixed(2)
                  })()}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  ${(() => {
                    const cost = session.operatingCost || 1
                    const type = session.operatingCostType || 'player'
                    const totalCost = type === 'player'
                      ? session.players * cost
                      : ((session.singlePackets || 0) + (session.doublePackets || 0)) * cost
                    return totalCost.toFixed(2)
                  })()}
                </div>
                <div className="text-sm text-gray-600">
                  Operating Costs (${(session.operatingCost || 1).toFixed(2)}/{session.operatingCostType || 'player'})
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  ${(() => {
                    const totalRevenue = ((session.singlePackets || 0) * (session.singlePacketPrice || 10)) +
                      ((session.doublePackets || 0) * (session.doublePacketPrice || 16))
                    const cost = session.operatingCost || 1
                    const type = session.operatingCostType || 'player'
                    const operatingCosts = type === 'player'
                      ? session.players * cost
                      : ((session.singlePackets || 0) + (session.doublePackets || 0)) * cost
                    const prizePool = Math.max(0, totalRevenue - operatingCosts)
                    return prizePool.toFixed(2)
                  })()}
                </div>
                <div className="text-sm text-gray-600">Available Prize Pool</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  ${(session.games.reduce((sum, game) => sum + game.prizeValue, 0)).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Allocated Prizes</div>
              </div>
            </div>
            {session.games.length >= 2 && (
              <div className="mt-3 pt-3 border-t border-blue-300">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 font-medium">Last Two Games (Double Prize):</span>
                  <div className="flex gap-4">
                    <span className="text-blue-900">
                      Game {session.games.length - 1}: <strong className="text-orange-600">${session.games[session.games.length - 2]?.prizeValue.toFixed(2)}</strong>
                    </span>
                    <span className="text-blue-900">
                      Game {session.games.length}: <strong className="text-orange-600">${session.games[session.games.length - 1]?.prizeValue.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={pauseSession}
              variant={sessionPaused ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              {sessionPaused ? (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Resume Session
                </>
              ) : (
                <>
                  <PauseCircle className="w-4 h-4" />
                  Pause Session
                </>
              )}
            </Button>
            <Button
              onClick={openEditPlayersDialog}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Edit Players
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Display Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Display Control</span>
            <Badge className={
              displayMode === 'auto' ? 'bg-blue-600' :
                displayMode === 'games-list' ? 'bg-green-600' : 'bg-orange-600'
            }>
              {displayMode === 'auto' ? 'Automatic' :
                displayMode === 'games-list' ? 'Games List' : 'Current Game'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setDisplayModeAndBroadcast('auto')}
                  variant={displayMode === 'auto' ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-2 h-16"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Auto</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Automatically switches display view based on game state</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setDisplayModeAndBroadcast('games-list')}
                  variant={displayMode === 'games-list' ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-2 h-16"
                >
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">Games List</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show all games with prizes - great for pre-game display</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setDisplayModeAndBroadcast('current-game')}
                  variant={displayMode === 'current-game' ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-2 h-16"
                  disabled={!gameState.isGameActive}
                >
                  <Play className="w-5 h-5" />
                  <span className="text-sm">Current Game</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show active game with called numbers and pattern</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {displayMode === 'auto' && 'Display automatically switches between games list and current game'}
            {displayMode === 'games-list' && 'Display shows games list regardless of game state'}
            {displayMode === 'current-game' && 'Display shows current game calling interface'}
          </p>
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={tipsEnabled}
                onChange={(e) => setTipsEnabled(e.target.checked)}
              />
              Show helpful tips
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickStartGuide(true)}
              className="text-xs"
            >
              Show Quick Start Guide
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Game Control</span>
              {currentGame && (
                <Badge>Game {currentGameIndex + 1} of {session.games.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!gameState.isGameActive ? (
              <div className="space-y-4">

                {/* Next Game Button */}
                {showNextGameButton && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-center space-y-3">
                      <h3 className="font-semibold text-lg text-green-800">Game Completed!</h3>
                      <p className="text-sm text-green-700">Ready to start the next game in the session</p>
                      <Button
                        onClick={startNextGame}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={sessionPaused}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Next Game ({session.games[lastCompletedGameIndex + 1]?.patternName})
                      </Button>
                    </div>
                  </div>
                )}

                <h3 className="font-semibold text-lg">Select Game to Start</h3>
                {tipsEnabled && !showNextGameButton && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Tip:</strong> Click any game's "Start" button to begin calling numbers. Games with the <Badge className="bg-orange-500 text-xs mx-1">DOUBLE PRIZE</Badge> badge have twice the prize value!
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {session.games.map((game, index) => {
                    const isLastTwo = session.games.length >= 2 && index >= session.games.length - 2
                    const isCompleted = game.status === 'completed'
                    const gamePattern = patterns[game.patternType]

                    return (
                      <div
                        key={game.id}
                        className={`flex items-center justify-between p-3 border rounded ${isLastTwo ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200' : ''
                          } ${isCompleted ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {gamePattern && (
                            <div className="flex-shrink-0">
                              <PatternVisualizer
                                pattern={gamePattern}
                                size="tiny"
                                showLabels={false}
                                animate={false}
                                patternColor={game.patternColor || session.patternColor || '#60a5fa'}
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">#{index + 1} - {game.patternName}</span>
                              {isLastTwo && (
                                <Badge className="bg-orange-500 text-xs">DOUBLE PRIZE</Badge>
                              )}
                              {isCompleted && (
                                <Badge variant="outline" className="text-xs">Completed</Badge>
                              )}
                            </div>
                            <div className={`text-sm ${isLastTwo ? 'text-orange-700 font-semibold' : 'text-gray-600'}`}>
                              ${game.prizeValue.toFixed(2)}
                              {isLastTwo && ' (2x)'}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setShowNextGameButton(false)
                            setLastCompletedGameIndex(-1)
                            startGame(index)
                          }}
                          size="sm"
                          disabled={isCompleted || sessionPaused}
                          className={isLastTwo ? 'bg-orange-600 hover:bg-orange-700' : ''}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {sessionPaused ? 'Paused' : isCompleted ? 'Completed' : 'Start'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-4">
                  <div className="w-64 h-64 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <span className="text-8xl font-bold text-white">
                      {gameState.lastCallDisplay || '-'}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Call #{gameState.callCount} / 75
                    {gameState.remainingCount > 0 && ` • ${gameState.remainingCount} remaining`}
                  </p>
                  {tipsEnabled && gameState.callCount === 0 && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-3 h-3 flex-shrink-0" />
                        <div>
                          <strong>Quick Tip:</strong> Press <kbd className="px-1 py-0.5 bg-white rounded border text-xs">Space</kbd> or click "Call Number" to start calling. Use <kbd className="px-1 py-0.5 bg-white rounded border text-xs">V</kbd> when someone wins.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={callNumber}
                        size="lg"
                        className="h-16 text-lg"
                        disabled={!gameState.isGameActive || sessionPaused}
                      >
                        {sessionPaused ? 'Game Paused' : 'Call Number'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Space</kbd> to call number</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={verifyWinner}
                        size="lg"
                        variant="secondary"
                        className="h-16 text-lg"
                        disabled={sessionPaused}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {sessionPaused ? 'Paused' : 'Verify Win'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">V</kbd> to verify winner</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Manual Number Input */}
                <div className="border-t pt-4">
                  <Label htmlFor="manual-number" className="text-sm font-medium mb-2 block">
                    Manual Number Entry
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="manual-number"
                      type="number"
                      min="1"
                      max="75"
                      value={manualNumberInput}
                      onChange={(e) => setManualNumberInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          callManualNumber()
                        }
                      }}
                      placeholder="Enter 1-75"
                      disabled={!gameState.isGameActive || sessionPaused}
                      className="flex-1"
                    />
                    <Button
                      onClick={callManualNumber}
                      disabled={!manualNumberInput || !gameState.isGameActive || sessionPaused}
                      variant="outline"
                    >
                      Call
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Manually specify a number to call (validates against excluded ranges and already called numbers)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoCallEnabled}
                          onChange={(e) => setAutoCallEnabled(e.target.checked)}
                          disabled={sessionPaused}
                        />
                        {sessionPaused ? 'Auto-call (paused)' : 'Auto-call every 10 seconds'}
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">A</kbd> to toggle auto-call</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleResetGame} variant="destructive" size="sm">
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset Game
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">R</kbd> to reset game</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Pattern Display */}
        {currentPattern && (
          <Card>
            <CardHeader>
              <CardTitle>Current Pattern</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <PatternVisualizer
                key={`visualizer-${currentGame?.id}-${currentGame?.patternColor || '#60a5fa'}`}
                pattern={currentPattern}
                size="large"
                showLabels={true}
                patternColor={currentGame?.patternColor || session?.patternColor || '#60a5fa'}
              />
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${currentGame?.prizeValue}
                </div>
                <div className="text-sm text-gray-600">Prize Value</div>
              </div>

              {/* Pattern Color Picker */}
              {session?.games[currentGameIndex] && (
                <div className="w-full mt-4 pt-4 border-t">
                  <Label htmlFor="pattern-color" className="text-sm font-medium mb-2 block">
                    Pattern Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="pattern-color"
                      type="color"
                      value={session.games[currentGameIndex].patternColor || session?.patternColor || '#60a5fa'}
                      onChange={async (e) => {
                        const newColor = e.target.value
                        const gameToUpdate = session.games[currentGameIndex]
                        console.log('Color picker changed to:', newColor)
                        try {
                          const response = await fetch(`/api/games/${gameToUpdate.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ patternColor: newColor })
                          })
                          if (response.ok) {
                            const updatedGame = await response.json()
                            console.log('Color updated in database:', updatedGame.patternColor)

                            // Update session state immediately with the new color
                            setSession(prevSession => {
                              if (!prevSession) return prevSession
                              const newSession = {
                                ...prevSession,
                                games: prevSession.games.map(g =>
                                  g.id === gameToUpdate.id
                                    ? { ...g, patternColor: updatedGame.patternColor }
                                    : g
                                )
                              }
                              console.log('Session state updated with new color:', newSession.games.find(g => g.id === gameToUpdate.id)?.patternColor)
                              return newSession
                            })

                            toast({
                              title: "Pattern Color Updated",
                              description: "The pattern color has been updated successfully",
                              variant: "default"
                            })
                          }
                        } catch (error) {
                          console.error('Failed to update pattern color:', error)
                          toast({
                            title: "Error",
                            description: "Failed to update pattern color",
                            variant: "destructive"
                          })
                        }
                      }}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={session.games[currentGameIndex].patternColor || session?.patternColor || '#60a5fa'}
                      onChange={async (e) => {
                        const newColor = e.target.value
                        const gameToUpdate = session.games[currentGameIndex]
                        if (/^#[0-9A-F]{6}$/i.test(newColor)) {
                          console.log('Hex input changed to:', newColor)
                          try {
                            const response = await fetch(`/api/games/${gameToUpdate.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ patternColor: newColor })
                            })
                            if (response.ok) {
                              const updatedGame = await response.json()
                              console.log('Color updated in database:', updatedGame.patternColor)

                              // Update session state immediately with the new color
                              setSession(prevSession => {
                                if (!prevSession) return prevSession
                                const newSession = {
                                  ...prevSession,
                                  games: prevSession.games.map(g =>
                                    g.id === gameToUpdate.id
                                      ? { ...g, patternColor: updatedGame.patternColor }
                                      : g
                                  )
                                }
                                console.log('Session state updated with new color:', newSession.games.find(g => g.id === gameToUpdate.id)?.patternColor)
                                return newSession
                              })
                            }
                          } catch (error) {
                            console.error('Failed to update pattern color:', error)
                          }
                        }
                      }}
                      placeholder="#60a5fa"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Color for pattern cells on display
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Call History */}
      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
        </CardHeader>
        <CardContent>
          {gameState.calledNumbers.length > 0 ? (
            <div className="grid grid-cols-10 gap-2">
              {gameState.calledNumbers.map((number, idx) => (
                <Badge
                  key={idx}
                  variant={idx === gameState.calledNumbers.length - 1 ? 'default' : 'secondary'}
                  className="text-center justify-center"
                >
                  {getBingoLetter(number)}-{number}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No numbers called yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-gray-600">RNG Integrity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{gameState.remainingCount}</div>
              <div className="text-sm text-gray-600">Numbers Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sessionId.slice(-8)}</div>
              <div className="text-sm text-gray-600">Session ID</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winner Verification Dialog */}
      <Dialog open={winnerDialogOpen} onOpenChange={setWinnerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Winner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="winnerName">Winner Name</Label>
              <Input
                id="winnerName"
                value={winner.name}
                onChange={(e) => setWinner(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter winner's name"
              />
            </div>
            <div>
              <Label htmlFor="winnerCard">Card Number (Optional)</Label>
              <Input
                id="winnerCard"
                value={winner.card}
                onChange={(e) => setWinner(prev => ({ ...prev, card: e.target.value }))}
                placeholder="Card #123 (optional)"
              />
            </div>
            <div className="text-sm text-gray-600">
              <strong>Pattern:</strong> {currentPattern?.name}<br />
              <strong>Calls Made:</strong> {gameState.callCount}<br />
              <strong>Last Call:</strong> {gameState.lastCallDisplay}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWinnerDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmWinner}>
                Confirm Winner
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Game Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Current Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the current game? This will clear all called numbers and start the game over. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetGame} className="bg-red-600 hover:bg-red-700">
              Reset Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Players Dialog */}
      <Dialog open={editPlayersDialogOpen} onOpenChange={setEditPlayersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Players, Packets & Pricing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Update the number of players, packets sold, and pricing configuration for this session.
            </div>

            {/* Players and Packets */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="players">Number of Players</Label>
                <Input
                  id="players"
                  type="number"
                  min="1"
                  value={editPlayersForm.players}
                  onChange={(e) => setEditPlayersForm(prev => ({
                    ...prev,
                    players: Math.max(1, parseInt(e.target.value) || 1)
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="editSinglePackets">Single Packets</Label>
                <Input
                  id="editSinglePackets"
                  type="number"
                  min="0"
                  value={editPlayersForm.singlePackets}
                  onChange={(e) => setEditPlayersForm(prev => ({
                    ...prev,
                    singlePackets: Math.max(0, parseInt(e.target.value) || 0)
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="editDoublePackets">Double Packets</Label>
                <Input
                  id="editDoublePackets"
                  type="number"
                  min="0"
                  value={editPlayersForm.doublePackets}
                  onChange={(e) => setEditPlayersForm(prev => ({
                    ...prev,
                    doublePackets: Math.max(0, parseInt(e.target.value) || 0)
                  }))}
                />
              </div>
            </div>

            {/* Pricing Configuration */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-3">Pricing Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="singlePacketPrice">Single Packet Price</Label>
                  <Input
                    id="singlePacketPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPlayersForm.singlePacketPrice}
                    onChange={(e) => setEditPlayersForm(prev => ({
                      ...prev,
                      singlePacketPrice: Math.max(0, parseFloat(e.target.value) || 0)
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="doublePacketPrice">Double Packet Price</Label>
                  <Input
                    id="doublePacketPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPlayersForm.doublePacketPrice}
                    onChange={(e) => setEditPlayersForm(prev => ({
                      ...prev,
                      doublePacketPrice: Math.max(0, parseFloat(e.target.value) || 0)
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label htmlFor="operatingCost">Operating Cost Amount</Label>
                  <Input
                    id="operatingCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPlayersForm.operatingCost}
                    onChange={(e) => setEditPlayersForm(prev => ({
                      ...prev,
                      operatingCost: Math.max(0, parseFloat(e.target.value) || 0)
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="operatingCostType">Operating Cost Type</Label>
                  <select
                    id="operatingCostType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editPlayersForm.operatingCostType}
                    onChange={(e) => setEditPlayersForm(prev => ({
                      ...prev,
                      operatingCostType: e.target.value as 'player' | 'packet'
                    }))}
                  >
                    <option value="player">Per Player</option>
                    <option value="packet">Per Packet</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 p-3 rounded text-sm border border-blue-200">
              <div className="font-medium text-blue-800 mb-2">Summary:</div>
              <div className="text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span>Total Packets:</span>
                  <strong>{editPlayersForm.singlePackets + editPlayersForm.doublePackets}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Revenue from Singles:</span>
                  <strong>${(editPlayersForm.singlePackets * editPlayersForm.singlePacketPrice).toFixed(2)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Revenue from Doubles:</span>
                  <strong>${(editPlayersForm.doublePackets * editPlayersForm.doublePacketPrice).toFixed(2)}</strong>
                </div>
                <div className="flex justify-between border-t border-blue-300 pt-1 mt-1">
                  <span>Total Revenue:</span>
                  <strong>
                    ${((editPlayersForm.singlePackets * editPlayersForm.singlePacketPrice) +
                      (editPlayersForm.doublePackets * editPlayersForm.doublePacketPrice)).toFixed(2)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Operating Costs:</span>
                  <strong className="text-red-600">
                    ${(() => {
                      const totalCost = editPlayersForm.operatingCostType === 'player'
                        ? editPlayersForm.players * editPlayersForm.operatingCost
                        : (editPlayersForm.singlePackets + editPlayersForm.doublePackets) * editPlayersForm.operatingCost
                      return totalCost.toFixed(2)
                    })()}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditPlayersDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={updatePlayers}>
                Update Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  )
}