import { auth, currentUser } from '@clerk/nextjs/server'

export type AdminData = {
  allowed: boolean
  stats: { questions: number; replies: number; votes: number; players: number }
  questions: { id: string; title: string; subject: string; author: string; date: string }[]
  replies: { id: string; body: string; author: string; date: string; questionTitle: string }[]
  topPlayers: { userId: string; exp: number }[]
}

export async function isAdmin() {
  const { userId } = await auth()
  if (!userId) return false
  const user = await currentUser()
  return user?.publicMetadata?.role === 'admin'
}