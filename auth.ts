import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        
        const user = await db.user.findUnique({
          where: { username: credentials.username as string }
        })
        
        if (!user || !await bcrypt.compare(credentials.password as string, user.password)) {
          return null
        }
        
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
        token.id = user.id // Explicitly set the id in the token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.username = token.username as string
        session.user.id = token.id as string // Use token.id instead of token.sub
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
})