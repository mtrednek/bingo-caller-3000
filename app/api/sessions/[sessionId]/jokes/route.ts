import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jokes from '@/lib/jokes.json'

const prisma = new PrismaClient()

interface Joke {
  id: number
  question: string
  answer: string
}

// Fisher-Yates shuffle algorithm for proper randomization
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    // Get the session with joke data
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        jokeOrder: true,
        currentJokeIndex: true
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // If joke order is empty, initialize it with shuffled joke IDs
    let jokeOrder = session.jokeOrder as number[]
    if (!jokeOrder || jokeOrder.length === 0) {
      // Create array of joke IDs and shuffle
      const jokeIds = jokes.map((joke: Joke) => joke.id)
      jokeOrder = shuffleArray(jokeIds)

      // Save the shuffled order to the database
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          jokeOrder: jokeOrder,
          currentJokeIndex: 0
        }
      })
    }

    // Get the current joke based on the index
    const currentJokeId = jokeOrder[session.currentJokeIndex]
    const currentJoke = jokes.find((joke: Joke) => joke.id === currentJokeId)

    return NextResponse.json({
      currentJoke,
      currentJokeIndex: session.currentJokeIndex,
      totalJokes: jokeOrder.length,
      hasMoreJokes: session.currentJokeIndex < jokeOrder.length - 1
    })
  } catch (error) {
    console.error('Failed to get session jokes:', error)
    return NextResponse.json(
      { error: 'Failed to get session jokes' },
      { status: 500 }
    )
  }
}

// Advance to the next joke
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    // Get the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        jokeOrder: true,
        currentJokeIndex: true
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const jokeOrder = session.jokeOrder as number[]

    // If we've shown all jokes, don't advance further
    if (session.currentJokeIndex >= jokeOrder.length - 1) {
      return NextResponse.json({
        message: 'All jokes have been shown',
        currentJokeIndex: session.currentJokeIndex,
        hasMoreJokes: false
      })
    }

    // Increment the joke index
    const newIndex = session.currentJokeIndex + 1
    await prisma.session.update({
      where: { id: sessionId },
      data: { currentJokeIndex: newIndex }
    })

    // Get the new current joke
    const currentJokeId = jokeOrder[newIndex]
    const currentJoke = jokes.find((joke: Joke) => joke.id === currentJokeId)

    return NextResponse.json({
      currentJoke,
      currentJokeIndex: newIndex,
      totalJokes: jokeOrder.length,
      hasMoreJokes: newIndex < jokeOrder.length - 1
    })
  } catch (error) {
    console.error('Failed to advance joke:', error)
    return NextResponse.json(
      { error: 'Failed to advance joke' },
      { status: 500 }
    )
  }
}
