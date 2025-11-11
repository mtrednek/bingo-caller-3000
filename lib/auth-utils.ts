import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }
  return session
}

export async function requireRole(requiredRole: string) {
  const session = await requireAuth()
  if (session.user.role !== requiredRole && session.user.role !== 'admin') {
    redirect('/')
  }
  return session
}