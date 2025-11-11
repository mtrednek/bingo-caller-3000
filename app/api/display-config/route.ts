import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get or create display config
    let config = await prisma.displayConfig.findFirst()

    if (!config) {
      config = await prisma.displayConfig.create({
        data: {
          currentJokeIndex: 0,
          gamesDisplaySeconds: 12,
          jokeQuestionSeconds: 8,
          jokeAnswerSeconds: 6,
          displayMargin: 0
        }
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Failed to get display config:', error)
    return NextResponse.json(
      { error: 'Failed to get display configuration' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    // Get or create config
    let config = await prisma.displayConfig.findFirst()

    if (!config) {
      config = await prisma.displayConfig.create({
        data: {
          currentJokeIndex: 0,
          gamesDisplaySeconds: 10,
          jokeQuestionSeconds: 5,
          jokeAnswerSeconds: 5,
          displayMargin: 0
        }
      })
    }

    // Update config
    const updated = await prisma.displayConfig.update({
      where: { id: config.id },
      data: {
        currentJokeIndex: body.currentJokeIndex ?? config.currentJokeIndex,
        gamesDisplaySeconds: body.gamesDisplaySeconds ?? config.gamesDisplaySeconds,
        jokeQuestionSeconds: body.jokeQuestionSeconds ?? config.jokeQuestionSeconds,
        jokeAnswerSeconds: body.jokeAnswerSeconds ?? config.jokeAnswerSeconds,
        displayMargin: body.displayMargin ?? config.displayMargin
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update display config:', error)
    return NextResponse.json(
      { error: 'Failed to update display configuration' },
      { status: 500 }
    )
  }
}
