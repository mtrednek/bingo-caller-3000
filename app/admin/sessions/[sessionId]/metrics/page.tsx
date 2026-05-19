'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { SessionMetrics } from '@/lib/session-metrics'
import { getBingoLetter } from '@/lib/session-metrics'

interface PageProps {
  params: Promise<{ sessionId: string }>
}

interface MetricsResponse {
  session: {
    id: string
    name: string
    status: string
    startTime?: string | null
    endTime?: string | null
    players: number
  }
  metrics: SessionMetrics
}

function NumberBadges({ numbers }: { numbers: number[] }) {
  if (numbers.length === 0) {
    return <span className="text-sm text-gray-500">None</span>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {numbers.map((n) => (
        <Badge key={n} variant="secondary" className="font-mono tabular-nums">
          {getBingoLetter(n)}-{n}
        </Badge>
      ))}
    </div>
  )
}

export default function SessionMetricsPage({ params }: PageProps) {
  const { sessionId } = use(params)
  const [data, setData] = useState<MetricsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/sessions/${sessionId}/metrics`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setError(body?.error || `Request failed (${res.status})`)
          setData(null)
        } else {
          setData(body)
        }
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load metrics')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600">Loading metrics...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 space-y-4">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Button>
        </Link>
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            {error || 'No data.'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const { session, metrics } = data
  const avg = metrics.averageCallsPerGame
  const fmtAvg = avg !== null ? avg.toFixed(1) : 'n/a'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Session Metrics</h1>
          <p className="text-sm text-gray-600">
            {session.name} · {session.players} players · Status:{' '}
            <Badge variant="secondary">{session.status}</Badge>
          </p>
        </div>
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Games played</div>
            <div className="text-2xl font-bold tabular-nums">{metrics.totalGames}</div>
            <div className="text-xs text-gray-500">{metrics.completedGames} completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Total calls</div>
            <div className="text-2xl font-bold tabular-nums">{metrics.totalCalls}</div>
            <div className="text-xs text-gray-500">avg {fmtAvg} per game</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Unique numbers called</div>
            <div className="text-2xl font-bold tabular-nums">
              {metrics.uniqueNumbersCalled}<span className="text-base text-gray-400"> / 75</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Even / Odd</div>
            <div className="text-2xl font-bold tabular-nums">
              {metrics.evenCount} / {metrics.oddCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Never called</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.neverCalled.length === 0 ? (
            <p className="text-sm text-gray-600">
              All 75 numbers were called at least once tonight.
            </p>
          ) : (
            <NumberBadges numbers={metrics.neverCalled} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Hottest number{(metrics.hottestNumbers?.numbers.length ?? 0) > 1 ? 's' : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.hottestNumbers ? (
              <div className="space-y-2">
                <NumberBadges numbers={metrics.hottestNumbers.numbers} />
                <p className="text-xs text-gray-500">
                  Called {metrics.hottestNumbers.count} time
                  {metrics.hottestNumbers.count === 1 ? '' : 's'} across the session.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No calls recorded.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Coldest called number{(metrics.coldestCalledNumbers?.numbers.length ?? 0) > 1 ? 's' : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.coldestCalledNumbers ? (
              <div className="space-y-2">
                <NumberBadges numbers={metrics.coldestCalledNumbers.numbers} />
                <p className="text-xs text-gray-500">
                  Called only {metrics.coldestCalledNumbers.count} time
                  {metrics.coldestCalledNumbers.count === 1 ? '' : 's'} (among numbers that were called at least once).
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No calls recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Called in every game</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.calledInEveryGame.length === 0 ? (
            <p className="text-sm text-gray-600">
              No single number was called in every game.
            </p>
          ) : (
            <NumberBadges numbers={metrics.calledInEveryGame} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>BINGO letter distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {metrics.letterDistribution.map(({ letter, count }) => {
              const max = Math.max(...metrics.letterDistribution.map((l) => l.count), 1)
              const pct = Math.round((count / max) * 100)
              const isHot = letter === metrics.hottestLetter && count > 0
              const isCold = letter === metrics.coldestLetter && count > 0 && metrics.hottestLetter !== metrics.coldestLetter
              return (
                <div key={letter} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-semibold">{letter}</span>
                    <span className="tabular-nums">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded">
                    <div
                      className={
                        'h-2 rounded ' +
                        (isHot ? 'bg-amber-500' : isCold ? 'bg-sky-400' : 'bg-gray-400')
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {metrics.hottestLetter && (
            <p className="text-xs text-gray-500 mt-3">
              Hottest letter: <span className="font-mono font-semibold">{metrics.hottestLetter}</span>
              {metrics.coldestLetter && metrics.coldestLetter !== metrics.hottestLetter && (
                <>
                  {' '}· Coldest:{' '}
                  <span className="font-mono font-semibold">{metrics.coldestLetter}</span>
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>First and last calls of the night</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {metrics.firstCall ? (
              <p>
                <span className="text-gray-500">First call:</span>{' '}
                <Badge variant="secondary" className="font-mono ml-1">
                  {getBingoLetter(metrics.firstCall.number)}-{metrics.firstCall.number}
                </Badge>{' '}
                <span className="text-gray-500">
                  · Game {metrics.firstCall.gameOrderIndex + 1} ({metrics.firstCall.patternName})
                </span>
              </p>
            ) : (
              <p className="text-gray-600">No calls.</p>
            )}
            {metrics.lastCall && (
              <p>
                <span className="text-gray-500">Last call:</span>{' '}
                <Badge variant="secondary" className="font-mono ml-1">
                  {getBingoLetter(metrics.lastCall.number)}-{metrics.lastCall.number}
                </Badge>{' '}
                <span className="text-gray-500">
                  · Game {metrics.lastCall.gameOrderIndex + 1} ({metrics.lastCall.patternName})
                </span>
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Shortest and longest games</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {metrics.shortestGame ? (
              <p>
                <span className="text-gray-500">Shortest:</span> Game{' '}
                {metrics.shortestGame.gameOrderIndex + 1} ({metrics.shortestGame.patternName}) ended in{' '}
                <span className="font-semibold tabular-nums">{metrics.shortestGame.calls}</span> calls.
              </p>
            ) : (
              <p className="text-gray-600">No games played.</p>
            )}
            {metrics.longestGame && (
              <p>
                <span className="text-gray-500">Longest:</span> Game{' '}
                {metrics.longestGame.gameOrderIndex + 1} ({metrics.longestGame.patternName}) needed{' '}
                <span className="font-semibold tabular-nums">{metrics.longestGame.calls}</span> calls.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Per-game summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="py-2 pr-2">Game</th>
                  <th className="py-2 pr-2">Pattern</th>
                  <th className="py-2 pr-2 text-right">Calls</th>
                  <th className="py-2 pr-2">First</th>
                  <th className="py-2 pr-2">Winning</th>
                  <th className="py-2 pr-2">Winner</th>
                  <th className="py-2 pr-2 text-right">Prize</th>
                </tr>
              </thead>
              <tbody>
                {metrics.perGame.map((g) => (
                  <tr key={g.gameOrderIndex} className="border-b last:border-b-0">
                    <td className="py-2 pr-2 tabular-nums">{g.gameOrderIndex + 1}</td>
                    <td className="py-2 pr-2">{g.patternName}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{g.calls}</td>
                    <td className="py-2 pr-2 font-mono">
                      {g.firstCall != null ? `${getBingoLetter(g.firstCall)}-${g.firstCall}` : '—'}
                    </td>
                    <td className="py-2 pr-2 font-mono">
                      {g.winningNumber != null ? `${getBingoLetter(g.winningNumber)}-${g.winningNumber}` : '—'}
                    </td>
                    <td className="py-2 pr-2">{g.winnerName || '—'}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      ${g.prizeValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
