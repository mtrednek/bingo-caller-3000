'use client'

import { useEffect, useState } from 'react'
import { X, WifiOff } from 'lucide-react'

interface SocketStatusBannerProps {
  isConnected: boolean
  initialGraceMs?: number
}

export function SocketStatusBanner({
  isConnected,
  initialGraceMs = 1500,
}: SocketStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [graceElapsed, setGraceElapsed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setGraceElapsed(true), initialGraceMs)
    return () => clearTimeout(t)
  }, [initialGraceMs])

  useEffect(() => {
    if (isConnected) setDismissed(false)
  }, [isConnected])

  if (isConnected || dismissed || !graceElapsed) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between shadow-lg"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium">
          Realtime connection unavailable. The display will fall back to a 3-second
          refresh. Check that the socket server is running.
        </span>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="ml-4 p-1 rounded hover:bg-black/20 transition-colors"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )
}
