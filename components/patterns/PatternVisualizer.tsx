import React, { useState, useEffect } from 'react'
import { BingoPattern, rotatePattern, mirrorPattern } from "@/lib/patterns"
import { cn } from "@/lib/utils"

interface PatternVisualizerProps {
  pattern: BingoPattern
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  className?: string
  showLabels?: boolean
  animate?: boolean // Whether to animate rotatable patterns
  patternColor?: string // Custom hex color for pattern cells (default: #60a5fa)
}

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']

export function PatternVisualizer({
  pattern,
  size = 'medium',
  className,
  showLabels = false,
  animate = true,
  patternColor = '#60a5fa'
}: PatternVisualizerProps) {
  const [currentTransformation, setCurrentTransformation] = useState(0)

  // Set up animation for patterns that can rotate or mirror
  useEffect(() => {
    if (!animate || (!pattern.canRotate && !pattern.canMirror)) return

    const delay = pattern.animationDelay || 1500 // Default 1.5s delay

    // Determine total transformations: 4 rotations, 2 mirrors, or 8 for both
    const totalTransformations = pattern.canRotate && pattern.canMirror ? 8 :
                                pattern.canRotate ? 4 : 2

    const intervalId = setInterval(() => {
      setCurrentTransformation(prev => (prev + 1) % totalTransformations)
    }, delay)

    return () => clearInterval(intervalId)
  }, [animate, pattern.canRotate, pattern.canMirror, pattern.animationDelay, pattern.name])


  // Force re-calculation when transformation changes
  const cells = React.useMemo(() => {
    const cells = Array(25).fill(false)

    if (animate && (pattern.canRotate || pattern.canMirror)) {
      let transformedCells = [...pattern.requiredCells]

      if (pattern.canRotate && pattern.canMirror) {
        // Both rotation and mirror: cycle through all 8 transformations
        // 0-3: rotations 0°, 90°, 180°, 270°
        // 4-7: mirrored versions of rotations 0°, 90°, 180°, 270°
        if (currentTransformation < 4) {
          transformedCells = rotatePattern(transformedCells, currentTransformation)
        } else {
          const rotation = currentTransformation - 4
          transformedCells = rotatePattern(transformedCells, rotation)
          transformedCells = mirrorPattern(transformedCells)
        }
      } else if (pattern.canRotate) {
        // Only rotation: 4 transformations
        transformedCells = rotatePattern(transformedCells, currentTransformation)
      } else if (pattern.canMirror) {
        // Only mirror: 2 transformations (normal and mirrored)
        if (currentTransformation === 1) {
          transformedCells = mirrorPattern(transformedCells)
        }
      }

      transformedCells.forEach(i => cells[i] = true)
    } else {
      pattern.requiredCells.forEach(i => cells[i] = true)
    }

    return cells
  }, [currentTransformation, pattern.canRotate, pattern.canMirror, pattern.requiredCells, pattern.name, animate])

  const sizeClasses = {
    tiny: 'w-20 h-20',
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
    xlarge: 'w-80 h-80'
  }

  const cellSizeClasses = {
    tiny: 'text-[0.6rem]',
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-lg',
    xlarge: 'text-xl'
  }

  return (
    <div className={cn("flex flex-col items-center space-y-0", className)}>
      {showLabels && (
        <div className="mb-1">
          <h3 className="font-semibold text-center">{pattern.name}</h3>
          <p className="text-xs text-muted-foreground text-center">{pattern.description}</p>
        </div>
      )}

      {/* BINGO header - hidden for tiny size */}
      {size !== 'tiny' && (
        <div className={cn("grid grid-cols-5 gap-1 mb-1", sizeClasses[size].split(' ')[0])}>
          {BINGO_LETTERS.map((letter, i) => (
            <div
              key={i}
              className={cn(
                "flex justify-center items-center font-bold text-white bg-blue-600 rounded py-1",
                cellSizeClasses[size]
              )}
            >
              {letter}
            </div>
          ))}
        </div>
      )}

      {/* Pattern grid */}
      <div className={cn(
        "grid grid-cols-5",
        sizeClasses[size],
        size === 'tiny' ? 'gap-0.5' : 'gap-1'
      )}>
        {cells.map((active, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square flex items-center justify-center font-bold transition-all",
              cellSizeClasses[size],
              size === 'tiny' ? 'border' : 'border-2',
              {
                // FREE space when part of pattern - green circle in white square
                'rounded bg-white border-white': active && i === 12,
                // Required cell (not FREE) - blue circle in white square
                'rounded bg-white border-white': active && i !== 12,
                // Empty cell or FREE space not in pattern - gray square
                'rounded bg-gray-100 border-gray-300 text-gray-400': !active,
              }
            )}
          >
            {active ? (
              <div
                className={cn(
                  "rounded-full w-[85%] h-[85%] flex items-center justify-center text-white",
                  {
                    'bg-green-400': i === 12,
                  }
                )}
                style={i !== 12 ? { backgroundColor: patternColor } : undefined}
              >
                {i === 12 && size !== 'tiny' ? 'FREE' : ''}
              </div>
            ) : (
              i === 12 && size !== 'tiny' ? 'FREE' : ''
            )}
          </div>
        ))}
      </div>

      {showLabels && (
        <div className="mt-1 text-center">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Difficulty: {pattern.difficulty}/5
            </span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded capitalize">
              {pattern.category}
            </span>
            {pattern.canRotate && (
              <span className={cn(
                "px-2 py-1 rounded",
                animate
                  ? "bg-orange-100 text-orange-800"
                  : "bg-gray-100 text-gray-800"
              )}>
                {animate ? `Rotating (${pattern.animationDelay || 1500}ms)` : 'Rotatable'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PatternVisualizer