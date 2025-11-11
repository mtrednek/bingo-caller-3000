import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends({
    query: {
      session: {
        async create({ args, query }) {
          // Ensure JSON fields are never empty strings
          if (args.data.jokeOrder === '' || !args.data.jokeOrder) {
            args.data.jokeOrder = []
          }
          return query(args)
        },
        async createMany({ args, query }) {
          const data = Array.isArray(args.data) ? args.data : [args.data]
          data.forEach(item => {
            if (!item.jokeOrder || item.jokeOrder === '') {
              item.jokeOrder = []
            }
          })
          return query(args)
        }
      },
      game: {
        async create({ args, query }) {
          // Ensure JSON fields are never empty strings
          if (args.data.calledNumbers === '' || !args.data.calledNumbers) {
            args.data.calledNumbers = []
          }
          return query(args)
        },
        async createMany({ args, query }) {
          const data = Array.isArray(args.data) ? args.data : [args.data]
          data.forEach(item => {
            if (!item.calledNumbers || item.calledNumbers === '') {
              item.calledNumbers = []
            }
          })
          return query(args)
        }
      }
    }
  })
}

export const db = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db