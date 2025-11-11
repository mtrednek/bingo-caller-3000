'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { generateDefaultGames, generateValidatedSession, calculateSessionFinancials, validateGameConfiguration, recalculateGamePrizes } from '@/lib/default-games'
import PatternVisualizer from '@/components/patterns/PatternVisualizer'
import { Plus, Trash2, Play, Settings, Eye, DollarSign, Users, FileText, Edit, Clock } from 'lucide-react'

interface GameConfig {
  id: string
  patternCode: string
  patternName: string
  prizeValue: number
  orderIndex: number
}

interface SessionConfig {
  name: string
  duration: number
  players: number
  singlePackets: number
  doublePackets: number
  singlePacketPrice: number
  doublePacketPrice: number
  operatingCost: number
  operatingCostType: 'player' | 'packet'
  games: GameConfig[]
}

interface Session {
  id: string
  name: string
  players: number
  duration: number
  status: string
  games: any[]
  createdAt: string
  user: any
  packetPrice?: number
  sheetsPerPacket?: number
}

interface EditSessionDialogProps {
  session: Session | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSessionUpdated: () => void
}

function EditSessionDialog({ session, isOpen, onOpenChange, onSessionUpdated }: EditSessionDialogProps) {
  const { toast } = useToast()
  const [editForm, setEditForm] = useState({
    name: '',
    players: 0,
    duration: 0,
    packetPrice: 0,
    sheetsPerPacket: 0,
    showFactoids: true
  })
  const [newPlayerCount, setNewPlayerCount] = useState(1)
  const [games, setGames] = useState<GameConfig[]>([])
  const [activePatterns, setActivePatterns] = useState<Record<string, any>>({})

  useEffect(() => {
    if (session) {
      setEditForm({
        name: session.name,
        players: session.players,
        duration: session.duration,
        packetPrice: session.packetPrice || 16,
        sheetsPerPacket: session.sheetsPerPacket || 13,
        showFactoids: (session as any).showFactoids !== undefined ? (session as any).showFactoids : true
      })
      setGames(session.games.map((game: any, index: number) => ({
        id: game.id,
        patternCode: game.patternType,
        patternName: game.patternName,
        prizeValue: game.prizeValue,
        orderIndex: index
      })))
      loadActivePatterns()
    }
  }, [session])

  const loadActivePatterns = async () => {
    try {
      const response = await fetch('/api/patterns')
      if (response.ok) {
        const patterns = await response.json()
        const activePatternMap = patterns
          .filter((p: any) => p.isActive)
          .reduce((acc: Record<string, any>, pattern: any) => {
            acc[pattern.code] = pattern
            return acc
          }, {})
        setActivePatterns(activePatternMap)
      }
    } catch (error) {
      console.error('Failed to load active patterns:', error)
    }
  }

  const addGame = () => {
    const gameId = crypto.randomUUID()
    const firstPatternCode = Object.keys(activePatterns)[0] || 'single_line'
    const newGame: GameConfig = {
      id: gameId,
      patternCode: firstPatternCode,
      patternName: activePatterns[firstPatternCode]?.name || 'Single Line',
      prizeValue: 10,
      orderIndex: games.length
    }
    setGames(prev => [...prev, newGame])
  }

  const updateGame = (gameId: string, updates: Partial<GameConfig>) => {
    setGames(prev => prev.map(game =>
      game.id === gameId ? { ...game, ...updates } : game
    ))
  }

  const removeGame = (gameId: string) => {
    setGames(prev => prev.filter(game => game.id !== gameId))
  }

  const updateSession = async (recalculatePrizes = false, includeGames = false) => {
    if (!session) return

    try {
      const updateData: any = {
        ...editForm,
        recalculatePrizes
      }

      // Include games if requested
      if (includeGames) {
        updateData.games = games
      }

      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast({
          title: 'Session Updated',
          description: includeGames
            ? 'Session and games updated successfully'
            : recalculatePrizes
              ? 'Session updated and prizes recalculated successfully'
              : 'Session updated successfully',
          variant: 'default'
        })
        onSessionUpdated()
      } else {
        const error = await response.text()
        toast({
          title: 'Update Failed',
          description: error || 'Failed to update session',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to update session:', error)
      toast({
        title: 'Error',
        description: 'Failed to update session. Please check your connection.',
        variant: 'destructive'
      })
    }
  }

  const addPlayer = async () => {
    if (!session) return

    try {
      const response = await fetch(`/api/sessions/${session.id}/add-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          singlePackets: newPlayerCount,
          doublePackets: 0
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: 'Player Added',
          description: `Added ${newPlayerCount} player(s). Revenue: $${result.addedPlayer.revenue}, Prize Pool Contribution: $${result.addedPlayer.prizePoolContribution}`,
          variant: 'default'
        })
        onSessionUpdated()
      } else {
        const error = await response.text()
        toast({
          title: 'Add Player Failed',
          description: error || 'Failed to add player',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to add player:', error)
      toast({
        title: 'Error',
        description: 'Failed to add player. Please check your connection.',
        variant: 'destructive'
      })
    }
  }

  if (!session) return null

  const currentPrizePool = session.games.reduce((sum: number, game: any) => sum + game.prizeValue, 0)
  const expectedPrizePool = editForm.players * Math.max(0, editForm.packetPrice - 1)
  const prizePoolDifference = expectedPrizePool - currentPrizePool

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Session: {session.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <Badge className="ml-2">{session.status}</Badge>
              </div>
              <div>
                <span className="font-medium">Games:</span>
                <span className="ml-2">{session.games.length}</span>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <span className="ml-2">{new Date(session.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium">Current Prize Pool:</span>
                <span className="ml-2 font-bold text-green-600">${currentPrizePool.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Session Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Session Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Session Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={editForm.duration}
                  onChange={(e) => setEditForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  min="30"
                  max="360"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-players">Players</Label>
                <Input
                  id="edit-players"
                  type="number"
                  value={editForm.players}
                  onChange={(e) => setEditForm(prev => ({ ...prev, players: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="500"
                />
              </div>
              <div>
                <Label htmlFor="edit-packet-price">Packet Price ($)</Label>
                <Input
                  id="edit-packet-price"
                  type="number"
                  step="0.01"
                  value={editForm.packetPrice}
                  onChange={(e) => setEditForm(prev => ({ ...prev, packetPrice: parseFloat(e.target.value) || 0 }))}
                  min="0.01"
                />
              </div>
              <div>
                <Label htmlFor="edit-sheets">Sheets per Packet</Label>
                <Input
                  id="edit-sheets"
                  type="number"
                  value={editForm.sheetsPerPacket}
                  onChange={(e) => setEditForm(prev => ({ ...prev, sheetsPerPacket: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-show-factoids">Show Factoids</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="edit-show-factoids"
                    type="checkbox"
                    checked={editForm.showFactoids}
                    onChange={(e) => setEditForm(prev => ({ ...prev, showFactoids: e.target.checked }))}
                    className="h-5 w-5 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Display factoids on screen</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Toggle joke/factoid display during pre-game</p>
              </div>
            </div>
          </div>

          {/* Prize Pool Analysis */}
          {prizePoolDifference !== 0 && (
            <div className={`p-4 rounded-lg ${prizePoolDifference > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <h4 className="font-medium text-sm mb-2">Prize Pool Analysis</h4>
              <div className="text-sm space-y-1">
                <div>Expected Prize Pool: ${expectedPrizePool.toFixed(2)} ({editForm.players} players × ${Math.max(0, editForm.packetPrice - 1).toFixed(2)} prize contribution)</div>
                <div>Current Prize Pool: ${currentPrizePool.toFixed(2)}</div>
                <div className={`font-medium ${prizePoolDifference > 0 ? 'text-blue-800' : 'text-yellow-800'}`}>
                  Difference: ${Math.abs(prizePoolDifference).toFixed(2)} {prizePoolDifference > 0 ? 'increase' : 'decrease'}
                </div>
              </div>
            </div>
          )}

          {/* Quick Add Players */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Add Players</h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="new-players">Number of Players to Add</Label>
                <Input
                  id="new-players"
                  type="number"
                  value={newPlayerCount}
                  onChange={(e) => setNewPlayerCount(parseInt(e.target.value) || 1)}
                  min="1"
                  max="50"
                />
              </div>
              <Button onClick={addPlayer} className="bg-green-600 hover:bg-green-700">
                <Users className="w-4 h-4 mr-2" />
                Add Player(s)
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              This will add {newPlayerCount} player(s) and automatically recalculate all prize values.
            </p>
          </div>

          {/* Games Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Games</h3>
              <Button onClick={addGame} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Game
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {games.map((game, index) => (
                <Card key={game.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Badge className="text-lg px-3 py-1">#{index + 1}</Badge>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label>Pattern</Label>
                        <Select
                          value={game.patternCode}
                          onValueChange={(value) => {
                            const pattern = activePatterns[value]
                            updateGame(game.id, {
                              patternCode: value,
                              patternName: pattern.name
                            })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-96">
                            {Object.entries(activePatterns)
                              .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                              .map(([code, pattern]) => (
                                <SelectItem key={code} value={code}>
                                  {pattern.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Prize Value ($)</Label>
                        <Input
                          type="number"
                          value={game.prizeValue}
                          onChange={(e) => updateGame(game.id, { prizeValue: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      {activePatterns[game.patternCode] && (
                        <PatternVisualizer
                          pattern={activePatterns[game.patternCode]}
                          size="tiny"
                          animate={false}
                        />
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeGame(game.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {games.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No games in this session. Click &quot;Add Game&quot; to add games.
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => updateSession(false, false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update Session Only
            </Button>
            <Button
              onClick={() => updateSession(false, true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Update Session & Games
            </Button>
            <Button
              onClick={() => updateSession(true, true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Update & Recalculate Prizes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDisplayConfigOpen, setIsDisplayConfigOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const [manuallyModifiedPrizes, setManuallyModifiedPrizes] = useState<Set<string>>(new Set())
  const [activePatterns, setActivePatterns] = useState<Record<string, any>>({})
  const [displayConfig, setDisplayConfig] = useState({
    gamesDisplaySeconds: 12,
    jokeQuestionSeconds: 8,
    jokeAnswerSeconds: 6,
    displayMargin: 0
  })
  const [newSession, setNewSession] = useState<SessionConfig>({
    name: 'Bingo Funday',
    duration: 180,
    players: 16,
    singlePackets: 1,
    doublePackets: 16,
    singlePacketPrice: 10.00,
    doublePacketPrice: 16.00,
    operatingCost: 1.00,
    operatingCostType: 'player',
    games: []
  })

  useEffect(() => {
    loadSessions()
    loadActivePatterns()
    loadDisplayConfig()
  }, [])

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

  const updateDisplayConfig = async () => {
    try {
      // Sanitize the config data before sending - ensure all values are valid numbers
      const sanitizedConfig = {
        gamesDisplaySeconds: typeof displayConfig.gamesDisplaySeconds === 'number' ? displayConfig.gamesDisplaySeconds : parseInt(String(displayConfig.gamesDisplaySeconds)) || 1,
        jokeQuestionSeconds: typeof displayConfig.jokeQuestionSeconds === 'number' ? displayConfig.jokeQuestionSeconds : parseInt(String(displayConfig.jokeQuestionSeconds)) || 1,
        jokeAnswerSeconds: typeof displayConfig.jokeAnswerSeconds === 'number' ? displayConfig.jokeAnswerSeconds : parseInt(String(displayConfig.jokeAnswerSeconds)) || 1,
        displayMargin: typeof displayConfig.displayMargin === 'number' ? displayConfig.displayMargin : parseInt(String(displayConfig.displayMargin)) || 0
      }

      const response = await fetch('/api/display-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedConfig)
      })

      if (response.ok) {
        // Update local state with sanitized values
        setDisplayConfig(sanitizedConfig)
        toast({
          title: 'Display Settings Updated',
          description: 'Display timing configuration has been updated successfully',
          variant: 'default'
        })
        setIsDisplayConfigOpen(false)
      } else {
        toast({
          title: 'Update Failed',
          description: 'Failed to update display configuration',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to update display config:', error)
      toast({
        title: 'Error',
        description: 'Failed to update display configuration',
        variant: 'destructive'
      })
    }
  }

  const loadActivePatterns = async () => {
    try {
      const response = await fetch('/api/patterns')
      if (response.ok) {
        const patterns = await response.json()
        const activePatternMap = patterns
          .filter((p: any) => p.isActive)
          .reduce((acc: Record<string, any>, pattern: any) => {
            acc[pattern.code] = pattern
            return acc
          }, {})
        setActivePatterns(activePatternMap)
      }
    } catch (error) {
      console.error('Failed to load active patterns:', error)
    }
  }

  // Calculate totals based on packet system
  const calculateTotals = () => {
    const totalRevenue = (newSession.singlePackets * newSession.singlePacketPrice) +
      (newSession.doublePackets * newSession.doublePacketPrice)

    // Calculate operating costs based on type
    const totalPackets = newSession.singlePackets + newSession.doublePackets
    const operatingCosts = newSession.operatingCostType === 'player'
      ? newSession.players * newSession.operatingCost
      : totalPackets * newSession.operatingCost

    // Prize pool = revenue - operating costs
    const totalPrizePool = Math.max(0, totalRevenue - operatingCosts)

    return {
      totalRevenue,
      totalPrizePool,
      totalPackets,
      operatingCosts,
      players: newSession.players
    }
  }

  // Calculate prize distribution for games
  const calculatePrizeDistribution = () => {
    const { totalPrizePool } = calculateTotals()
    const gameCount = newSession.games.length

    if (gameCount === 0) return []

    const prizes: number[] = []

    if (gameCount === 1) {
      // Only one game, gets the entire prize pool (rounded down)
      prizes.push(Math.floor(totalPrizePool))
    } else if (gameCount === 2) {
      // Two games: first gets standard amount, second gets double (both rounded down)
      const standardPrize = Math.floor(totalPrizePool / 3) // 1/3 of pool
      const doublePrize = Math.floor(totalPrizePool * 2 / 3) // 2/3 of pool (double)
      prizes.push(standardPrize)
      prizes.push(doublePrize)
    } else {
      // 3+ games: All regular games equal, last two games double
      const regularGameCount = gameCount - 2

      // Calculate prize amounts:
      // If regular games get X each, final two get 2X each
      // Total: (regularGameCount × X) + (2 × 2X) = regularGameCount × X + 4X = X(regularGameCount + 4)
      // So X = totalPrizePool / (regularGameCount + 4)
      const standardPrize = Math.floor(totalPrizePool / (regularGameCount + 4))
      const doublePrize = standardPrize * 2

      // Add regular games (all equal)
      for (let i = 0; i < regularGameCount; i++) {
        prizes.push(standardPrize)
      }

      // Add final two games (double prizes)
      prizes.push(doublePrize) // Double Bingo
      prizes.push(doublePrize) // Coverall
    }

    return prizes
  }

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSession = async () => {
    if (!newSession.name.trim()) {
      toast({
        title: "Session Name Required",
        description: "Please enter a session name",
        variant: "destructive"
      })
      return
    }

    if (newSession.games.length === 0) {
      toast({
        title: "Games Required",
        description: "Please add at least one game to the session",
        variant: "destructive"
      })
      return
    }

    // Validate game configuration for uniqueness
    const gameValidation = validateGameConfiguration(newSession.games.map(g => ({
      patternCode: g.patternCode,
      patternName: g.patternName,
      prizeValue: g.prizeValue,
      orderIndex: g.orderIndex
    })))

    if (!gameValidation.isValid) {
      toast({
        title: "Game Configuration Issues",
        description: `Please fix these issues: ${gameValidation.issues.join(', ')}`,
        variant: "destructive"
      })
      return
    }

    try {
      const sessionData = {
        name: newSession.name,
        players: newSession.players,
        duration: newSession.duration,
        singlePackets: newSession.singlePackets,
        doublePackets: newSession.doublePackets,
        singlePacketPrice: newSession.singlePacketPrice,
        doublePacketPrice: newSession.doublePacketPrice,
        operatingCost: newSession.operatingCost,
        operatingCostType: newSession.operatingCostType,
        games: newSession.games
      }

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })

      if (response.ok) {
        const session = await response.json()
        window.open(`/display/${session.id}`, '_blank')
        setIsCreateDialogOpen(false)
        setNewSession({
          name: 'Bingo Funday',
          duration: 180,
          players: 16,
          singlePackets: 1,
          doublePackets: 16,
          singlePacketPrice: 10.00,
          doublePacketPrice: 16.00,
          operatingCost: 1.00,
          operatingCostType: 'player',
          games: []
        })
        setManuallyModifiedPrizes(new Set())
        loadSessions()
        toast({
          title: "Session Created",
          description: `${newSession.name} has been created successfully`,
          variant: "default"
        })
      } else {
        toast({
          title: "Creation Failed",
          description: "Failed to create session. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to create session:', error)
      toast({
        title: "Error",
        description: "Failed to create session. Please check your connection.",
        variant: "destructive"
      })
    }
  }

  // Recalculate prizes when session parameters change
  const recalculatePrizes = () => {
    if (newSession.games.length === 0) return

    const newPrizes = calculatePrizeDistribution()
    const updatedGames: GameConfig[] = newSession.games.map((game, index) => ({
      ...game,
      prizeValue: newPrizes[index] || 0
    }))

    setNewSession(prev => ({
      ...prev,
      games: updatedGames
    }))

    // Clear manual modification tracking since all prizes are now auto-calculated
    setManuallyModifiedPrizes(new Set())

    const { totalPrizePool } = calculateTotals()
    toast({
      title: "Prizes Recalculated",
      description: `Prize values updated based on packet sales (Prize Pool: $${totalPrizePool})`,
      variant: "default"
    })
  }

  const generateGames = async () => {
    const { totalPrizePool } = calculateTotals()

    try {
      // Use API route to generate games with active patterns only
      const response = await fetch('/api/games/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packetPrice: 10, // dummy packet price (we'll override prizes anyway)
          expectedPlayers: 15, // dummy player count
          gameCount: 13, // Generate 13 games as requested
          prizePercentage: 60  // dummy percentage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate games')
      }

      const { games: defaultGames, validation, activePatternCount } = await response.json()

      if (activePatternCount === 0) {
        toast({
          title: "No Active Patterns",
          description: "No active patterns found in the database. Please activate some patterns first.",
          variant: "destructive"
        })
        return
      }

      // Override the prizes with our equal distribution logic
      const gameCount = 13
      const prizes: number[] = []

      if (gameCount <= 2) {
        // Handle edge cases
        if (gameCount === 1) {
          prizes.push(Math.round(totalPrizePool))
        } else {
          const standardPrize = Math.round(totalPrizePool / 3)
          const doublePrize = Math.round(totalPrizePool * 2 / 3)
          prizes.push(standardPrize, doublePrize)
        }
      } else {
        // 3+ games: All regular games equal, last two games double
        const regularGameCount = gameCount - 2
        const standardPrize = Math.round(totalPrizePool / (regularGameCount + 4))
        const doublePrize = standardPrize * 2

        // Add regular games (all equal)
        for (let i = 0; i < regularGameCount; i++) {
          prizes.push(standardPrize)
        }

        // Add final two games (double prizes)
        prizes.push(doublePrize) // Double Bingo
        prizes.push(doublePrize) // Coverall
      }

      if (!validation.isValid) {
        toast({
          title: "Generation Warning",
          description: `Generated games with issues: ${validation.issues.join(', ')}`,
          variant: "destructive"
        })
      }

      const games: GameConfig[] = defaultGames.map((defaultGame, index) => ({
        id: crypto.randomUUID(),
        patternCode: defaultGame.patternCode,
        patternName: defaultGame.patternName,
        prizeValue: prizes[index] || 0, // Use our calculated equal prizes instead
        orderIndex: index
      }))

      setNewSession(prev => ({
        ...prev,
        games
      }))

      // Clear manual modification tracking since all prizes are auto-calculated
      setManuallyModifiedPrizes(new Set())

      if (validation.isValid) {
        const standardPrize = prizes[0] || 0
        const finalPrize = prizes[prizes.length - 1] || 0
        toast({
          title: "Games Generated",
          description: `Successfully generated 13 unique games with equal prizes ($${standardPrize} regular, $${finalPrize} final games)`,
          variant: "default"
        })
      }
    } catch (error) {
      console.error('Failed to generate games:', error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate games with active patterns. Please try again or check that patterns are active.",
        variant: "destructive"
      })
    }
  }

  const addGame = () => {
    const gameId = crypto.randomUUID()
    const newGame: GameConfig = {
      id: gameId,
      patternCode: 'single_line',
      patternName: PATTERNS.single_line.name,
      prizeValue: 10,
      orderIndex: newSession.games.length
    }

    setNewSession(prev => {
      const updatedGames = [...prev.games, newGame]
      return {
        ...prev,
        games: enforceSpecialEnding(updatedGames)
      }
    })
  }

  // Enforce special ending for sessions with 11+ games and check for uniqueness
  const enforceSpecialEnding = (games: GameConfig[]): GameConfig[] => {
    if (games.length < 11) return games

    const updatedGames = [...games]

    // Ensure penultimate game is double_bingo
    if (updatedGames.length >= 2) {
      const penultimateIndex = updatedGames.length - 2
      if (updatedGames[penultimateIndex].patternCode !== 'double_bingo') {
        updatedGames[penultimateIndex] = {
          ...updatedGames[penultimateIndex],
          patternCode: 'double_bingo',
          patternName: PATTERNS.double_bingo.name
        }
      }
    }

    // Ensure final game is coverall
    const finalIndex = updatedGames.length - 1
    if (updatedGames[finalIndex].patternCode !== 'coverall') {
      updatedGames[finalIndex] = {
        ...updatedGames[finalIndex],
        patternCode: 'coverall',
        patternName: PATTERNS.coverall.name
      }
    }

    // Note: Duplicate validation is handled separately to avoid render-time toast calls

    return updatedGames
  }

  const updateGame = (gameId: string, updates: Partial<GameConfig>) => {
    setNewSession(prev => {
      const updatedGames = prev.games.map(game =>
        game.id === gameId
          ? { ...game, ...updates }
          : game
      )
      return {
        ...prev,
        games: enforceSpecialEnding(updatedGames)
      }
    })
  }

  // Effect to check for duplicate patterns and show warnings
  useEffect(() => {
    if (newSession.games.length === 0) return

    const patternCounts: { [key: string]: number } = {}
    newSession.games.forEach(game => {
      patternCounts[game.patternCode] = (patternCounts[game.patternCode] || 0) + 1
    })

    const duplicates = Object.entries(patternCounts).filter(([_, count]) => count > 1)
    if (duplicates.length > 0) {
      const duplicateNames = duplicates.map(([code, count]) => `${activePatterns[code]?.name || code} (${count}x)`).join(', ')

      // Use setTimeout to avoid calling toast during render
      setTimeout(() => {
        toast({
          title: "Duplicate Patterns Detected",
          description: `These patterns appear multiple times: ${duplicateNames}. Each pattern should be unique.`,
          variant: "destructive"
        })
      }, 0)
    }
  }, [newSession.games, activePatterns, toast])

  const removeGame = (gameId: string) => {
    setNewSession(prev => {
      const updatedGames = prev.games.filter(game => game.id !== gameId)
      return {
        ...prev,
        games: enforceSpecialEnding(updatedGames)
      }
    })
  }

  const openEditDialog = (session: Session) => {
    setEditingSession(session)
    setIsEditDialogOpen(true)
  }

  const handleDeleteSession = (sessionId: string) => {
    setDeleteSessionId(sessionId)
  }

  const deleteSession = async () => {
    if (!deleteSessionId) return

    try {
      const response = await fetch(`/api/sessions/${deleteSessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadSessions()
        toast({
          title: "Session Deleted",
          description: "Session has been successfully deleted",
          variant: "default"
        })
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete session. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
      toast({
        title: "Error",
        description: "Failed to delete session. Please check your connection.",
        variant: "destructive"
      })
    } finally {
      setDeleteSessionId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

        <div className="flex gap-2">
          <Dialog open={isDisplayConfigOpen} onOpenChange={setIsDisplayConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Display Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Display Screen Settings</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Configure the timing for the pre-game display screen that cycles between showing games and jokes.
                </p>

                <div>
                  <Label htmlFor="gamesDisplay">Games Display Duration (seconds)</Label>
                  <Input
                    id="gamesDisplay"
                    type="number"
                    value={displayConfig.gamesDisplaySeconds}
                    onChange={(e) => setDisplayConfig(prev => ({
                      ...prev,
                      gamesDisplaySeconds: e.target.value === '' ? '' as any : parseInt(e.target.value)
                    }))}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 1) {
                        setDisplayConfig(prev => ({ ...prev, gamesDisplaySeconds: 1 }))
                      }
                    }}
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">How long to show the games list</p>
                </div>

                <div>
                  <Label htmlFor="jokeQuestion">Joke Question Duration (seconds)</Label>
                  <Input
                    id="jokeQuestion"
                    type="number"
                    value={displayConfig.jokeQuestionSeconds}
                    onChange={(e) => setDisplayConfig(prev => ({
                      ...prev,
                      jokeQuestionSeconds: e.target.value === '' ? '' as any : parseInt(e.target.value)
                    }))}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 1) {
                        setDisplayConfig(prev => ({ ...prev, jokeQuestionSeconds: 1 }))
                      }
                    }}
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">How long to show just the question</p>
                </div>

                <div>
                  <Label htmlFor="jokeAnswer">Joke Answer Duration (seconds)</Label>
                  <Input
                    id="jokeAnswer"
                    type="number"
                    value={displayConfig.jokeAnswerSeconds}
                    onChange={(e) => setDisplayConfig(prev => ({
                      ...prev,
                      jokeAnswerSeconds: e.target.value === '' ? '' as any : parseInt(e.target.value)
                    }))}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 1) {
                        setDisplayConfig(prev => ({ ...prev, jokeAnswerSeconds: 1 }))
                      }
                    }}
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">How long to show the question with answer</p>
                </div>

                <div>
                  <Label htmlFor="displayMargin">Display Outer Margin (pixels)</Label>
                  <Input
                    id="displayMargin"
                    type="number"
                    value={displayConfig.displayMargin}
                    onChange={(e) => setDisplayConfig(prev => ({
                      ...prev,
                      displayMargin: e.target.value === '' ? '' as any : parseInt(e.target.value)
                    }))}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 0) {
                        setDisplayConfig(prev => ({ ...prev, displayMargin: 0 }))
                      }
                    }}
                    min="0"
                    max="200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Add margin around the display area for screens where content is cut off</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Total cycle time:</strong> {displayConfig.gamesDisplaySeconds + displayConfig.jokeQuestionSeconds + displayConfig.jokeAnswerSeconds} seconds
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Games → Joke Question → Joke Answer → repeat
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDisplayConfigOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateDisplayConfig}>
                    Save Settings
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Bingo Session</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Session Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sessionName">Session Name</Label>
                    <Input
                      id="sessionName"
                      value={newSession.name}
                      onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Monday Night Bingo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newSession.duration}
                      onChange={(e) => setNewSession(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      min="30"
                      max="360"
                    />
                  </div>
                </div>

                {/* Players and Packets */}
                <div>
                  <Label className="text-lg font-medium">Players & Packets</Label>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <Label htmlFor="players">Number of Players</Label>
                      <Input
                        id="players"
                        type="number"
                        value={newSession.players}
                        onChange={(e) => setNewSession(prev => ({ ...prev, players: parseInt(e.target.value) || 1 }))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="singlePackets">Single Packets</Label>
                      <Input
                        id="singlePackets"
                        type="number"
                        value={newSession.singlePackets}
                        onChange={(e) => setNewSession(prev => ({ ...prev, singlePackets: parseInt(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="doublePackets">Double Packets</Label>
                      <Input
                        id="doublePackets"
                        type="number"
                        value={newSession.doublePackets}
                        onChange={(e) => setNewSession(prev => ({ ...prev, doublePackets: parseInt(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Configuration */}
                <div>
                  <Label className="text-lg font-medium">Pricing Configuration</Label>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label htmlFor="singlePacketPrice">Single Packet Price</Label>
                      <Input
                        id="singlePacketPrice"
                        type="number"
                        step="0.01"
                        value={newSession.singlePacketPrice}
                        onChange={(e) => setNewSession(prev => ({ ...prev, singlePacketPrice: parseFloat(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="doublePacketPrice">Double Packet Price</Label>
                      <Input
                        id="doublePacketPrice"
                        type="number"
                        step="0.01"
                        value={newSession.doublePacketPrice}
                        onChange={(e) => setNewSession(prev => ({ ...prev, doublePacketPrice: parseFloat(e.target.value) || 0 }))}
                        min="0"
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
                        value={newSession.operatingCost}
                        onChange={(e) => setNewSession(prev => ({ ...prev, operatingCost: parseFloat(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="operatingCostType">Operating Cost Type</Label>
                      <select
                        id="operatingCostType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newSession.operatingCostType}
                        onChange={(e) => setNewSession(prev => ({ ...prev, operatingCostType: e.target.value as 'player' | 'packet' }))}
                      >
                        <option value="player">Per Player</option>
                        <option value="packet">Per Packet</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                {newSession.games.length > 0 && (() => {
                  const { totalRevenue, totalPrizePool, totalPackets, operatingCosts } = calculateTotals()
                  const totalPrizes = newSession.games.reduce((sum, game) => sum + game.prizeValue, 0)

                  return (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Session Financial Summary
                      </h3>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600 font-medium">Total Revenue</span>
                          <div className="text-lg font-bold text-green-600">
                            ${totalRevenue.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium">Total Prizes</span>
                          <div className="text-lg font-bold text-blue-600">
                            ${totalPrizes.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium">Operating Costs</span>
                          <div className="text-lg font-bold text-red-600">
                            ${operatingCosts.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium">Total Packets</span>
                          <div className="text-lg font-bold text-gray-700">
                            {totalPackets}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Games Configuration */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-medium">Games</Label>
                    <div className="flex gap-2">
                      {newSession.games.length === 0 && (
                        <Button onClick={generateGames} size="sm" className="bg-green-600 hover:bg-green-700">
                          <FileText className="w-4 h-4 mr-1" />
                          Generate 13 Games
                        </Button>
                      )}
                      {newSession.games.length > 0 && (
                        <Button onClick={recalculatePrizes} size="sm" variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Recalculate Prizes
                        </Button>
                      )}
                      <Button onClick={addGame} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Game
                      </Button>
                    </div>
                  </div>

                  {newSession.games.length >= 11 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-600 font-medium text-sm">ℹ️ Special Ending:</div>
                        <div className="text-sm text-blue-800">
                          For sessions with 11+ games, the last two games are automatically set to <strong>Double Bingo</strong> (penultimate) and <strong>Coverall</strong> (final). These games are locked and cannot be modified.
                        </div>
                      </div>
                    </div>
                  )}

                  {newSession.games.length > 0 && (() => {
                    const { totalRevenue, totalPrizePool, operatingCosts } = calculateTotals()
                    return (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="text-green-600 font-medium text-sm">💰 Prize Calculation:</div>
                          <div className="text-sm text-green-800">
                            Prizes are automatically calculated from the prize pool. Revenue: ${totalRevenue.toFixed(2)} - Operating Costs: ${operatingCosts.toFixed(2)} ({newSession.operatingCostType === 'player' ? `${newSession.players} players × $${newSession.operatingCost.toFixed(2)}` : `${newSession.singlePackets + newSession.doublePackets} packets × $${newSession.operatingCost.toFixed(2)}`}) = Prize Pool: ${totalPrizePool.toFixed(2)}. All regular games have equal prizes, and the last two games pay double. You can manually override any prize value - these will be marked as "CUSTOM".
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  <div className="space-y-3">
                    {newSession.games.map((game, index) => {
                      const isSpecialEnding = newSession.games.length >= 11 && index >= newSession.games.length - 2
                      const isPenultimate = isSpecialEnding && index === newSession.games.length - 2
                      const isFinal = isSpecialEnding && index === newSession.games.length - 1
                      const isLocked = isSpecialEnding && (
                        (isPenultimate && game.patternCode === 'double_bingo') ||
                        (isFinal && game.patternCode === 'coverall')
                      )

                      return (
                        <Card key={game.id} className={`p-4 ${isSpecialEnding ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                              <Badge className={`text-lg px-3 py-1 ${isSpecialEnding ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}>
                                #{index + 1}
                              </Badge>
                              {isPenultimate && (
                                <Badge variant="outline" className="text-xs px-2 py-1 border-blue-500 text-blue-700">
                                  DOUBLE BINGO
                                </Badge>
                              )}
                              {isFinal && (
                                <Badge variant="outline" className="text-xs px-2 py-1 border-red-500 text-red-700">
                                  COVERALL
                                </Badge>
                              )}
                              {isLocked && (
                                <Badge variant="outline" className="text-xs px-1 py-0 border-gray-400 text-gray-600">
                                  LOCKED
                                </Badge>
                              )}
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Pattern</Label>
                                <Select
                                  value={game.patternCode}
                                  disabled={isLocked}
                                  onValueChange={(value) => {
                                    if (isLocked) return // Extra protection
                                    const pattern = activePatterns[value]
                                    updateGame(game.id, {
                                      patternCode: value,
                                      patternName: pattern.name
                                    })
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-96">
                                    {Object.entries(activePatterns)
                                      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                                      .map(([code, pattern]) => (
                                        <SelectItem key={code} value={code}>
                                          <div className="flex items-center justify-between w-full">
                                            <span>{pattern.name}</span>
                                            <div className="flex items-center gap-1 text-xs">
                                              <span className="text-gray-500">Diff: {pattern.difficulty}/5</span>
                                            </div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label className="flex items-center gap-2">
                                  Prize Value ($)
                                  {manuallyModifiedPrizes.has(game.id) && (
                                    <Badge variant="outline" className="text-xs px-1 py-0 border-orange-400 text-orange-700">
                                      CUSTOM
                                    </Badge>
                                  )}
                                </Label>
                                <Input
                                  type="number"
                                  value={game.prizeValue}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value) || 0
                                    updateGame(game.id, { prizeValue: newValue })
                                    // Mark this prize as manually modified
                                    setManuallyModifiedPrizes(prev => new Set([...prev, game.id]))
                                  }}
                                  min="0"
                                  step="0.01"
                                  className={manuallyModifiedPrizes.has(game.id) ? 'border-orange-300 bg-orange-50' : ''}
                                />
                              </div>

                              <div className="flex items-end">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isLocked}
                                  onClick={() => !isLocked && removeGame(game.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </Button>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <PatternVisualizer
                                pattern={activePatterns[game.patternCode]}
                                size="small"
                              />
                            </div>
                          </div>
                        </Card>
                      )
                    })}

                    {newSession.games.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No games added yet. Click &quot;Add Game&quot; to get started.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createSession}>
                    Create Session & Open Display
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sessions created yet. Create your first session to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{session.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>{session.players} players</span>
                      <span>{session.games.length} games</span>
                      <span>{session.duration} minutes</span>
                      <span>Created: {new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={
                      session.status === 'active' ? 'default' :
                        session.status === 'completed' ? 'secondary' :
                          'outline'
                    }>
                      {session.status}
                    </Badge>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/display/${session.id}`, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Display
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(session)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/admin/control/${session.id}`, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <Settings className="w-4 h-4" />
                      Control
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteSession(session.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === 'active').length}
            </div>
            <p className="text-sm text-gray-600">Active Sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {Object.keys(activePatterns).length}
            </div>
            <p className="text-sm text-gray-600">Active Patterns</p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Session Dialog */}
      <EditSessionDialog
        session={editingSession}
        isOpen={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) setEditingSession(null)
        }}
        onSessionUpdated={() => {
          loadSessions()
          setIsEditDialogOpen(false)
          setEditingSession(null)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteSessionId !== null} onOpenChange={(open) => !open && setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot be undone and will permanently delete all games and data associated with this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSession} className="bg-red-600 hover:bg-red-700">
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}