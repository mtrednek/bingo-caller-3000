/**
 * Export all patterns from the database to TypeScript format
 * This script reads patterns from the database and outputs them in the format
 * needed for the seed file.
 *
 * Usage: npx tsx scripts/export-patterns.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function exportPatterns() {
  console.log('Exporting patterns from database...\n')

  try {
    const patterns = await prisma.pattern.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    console.log(`Found ${patterns.length} patterns in database\n`)
    console.log('// Pattern export - Copy this to prisma/seed.ts\n')
    console.log('const DATABASE_PATTERNS = [')

    patterns.forEach((pattern, index) => {
      // Handle different possible formats for JSON fields
      let altNames: string[] = []
      let requiredCells: number[] = []
      let excludedRanges: string[] = []

      try {
        altNames = typeof pattern.altNames === 'string'
          ? JSON.parse(pattern.altNames)
          : (pattern.altNames as any) || []
      } catch (e) {
        console.error(`Warning: Could not parse altNames for ${pattern.code}:`, pattern.altNames)
        altNames = []
      }

      try {
        requiredCells = typeof pattern.requiredCells === 'string'
          ? JSON.parse(pattern.requiredCells)
          : (pattern.requiredCells as any) || []
      } catch (e) {
        console.error(`Warning: Could not parse requiredCells for ${pattern.code}:`, pattern.requiredCells)
        requiredCells = []
      }

      try {
        if (pattern.excludedRanges) {
          excludedRanges = typeof pattern.excludedRanges === 'string'
            ? JSON.parse(pattern.excludedRanges)
            : (pattern.excludedRanges as any) || []
        }
      } catch (e) {
        console.error(`Warning: Could not parse excludedRanges for ${pattern.code}:`, pattern.excludedRanges)
        excludedRanges = []
      }

      console.log(`  {`)
      console.log(`    code: '${pattern.code}',`)
      console.log(`    name: '${pattern.name.replace(/'/g, "\\'")}',`)
      console.log(`    altNames: ${JSON.stringify(altNames)},`)
      console.log(`    category: '${pattern.category}',`)
      console.log(`    difficulty: ${pattern.difficulty},`)
      console.log(`    requiredCells: ${JSON.stringify(requiredCells)},`)
      console.log(`    description: '${pattern.description.replace(/'/g, "\\'")}',`)
      console.log(`    isActive: ${pattern.isActive},`)
      console.log(`    canRotate: ${pattern.canRotate},`)
      console.log(`    canMirror: ${pattern.canMirror},`)
      console.log(`    animationDelay: ${pattern.animationDelay || 'null'},`)
      if (excludedRanges.length > 0) {
        console.log(`    excludedRanges: ${JSON.stringify(excludedRanges)},`)
      }
      console.log(`  }${index < patterns.length - 1 ? ',' : ''}`)
    })

    console.log(']\n')

    // Statistics
    const activePatterns = patterns.filter(p => p.isActive)
    const inactivePatterns = patterns.filter(p => !p.isActive)

    console.log('\n=== Pattern Statistics ===')
    console.log(`Total patterns: ${patterns.length}`)
    console.log(`Active patterns: ${activePatterns.length}`)
    console.log(`Inactive patterns: ${inactivePatterns.length}`)

    // Category breakdown
    const categories = patterns.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n=== By Category ===')
    Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`${cat}: ${count}`)
    })

  } catch (error) {
    console.error('Error exporting patterns:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportPatterns()
