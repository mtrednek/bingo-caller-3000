import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'lib', 'factoids.json')
    const fileContents = readFileSync(filePath, 'utf8')
    const factoids = JSON.parse(fileContents)

    return NextResponse.json(factoids)
  } catch (error) {
    console.error('Failed to load factoids:', error)
    return NextResponse.json({ error: 'Failed to load factoids' }, { status: 500 })
  }
}
