import { auth, currentUser } from '@clerk/nextjs/server'

export type AdminQuestion = {
  id: string
  title: string
  subject: string
  details: string
  author: string
  authorId: string
  date: string
  status: string
}

export type AdminReply = {
  id: string
  body: string
  author: string
  authorId: string
  date: string
  questionTitle: string
}

export type AdminSanction = {
  userId: string
  userName: string
  kind: 'suspended' | 'banned'
  until: string | null
  reason: string | null
  active: boolean
}

export type AdminUser = {
  userId: string
  name: string
  email: string
  joined: string
  exp: number
  status: 'active' | 'suspended' | 'banned'
  until: string | null
}

export type AdminData = {
  allowed: boolean
  stats: { pending: number; questions: number; replies: number; votes: number; players: number }
  pending: AdminQuestion[]
  questions: AdminQuestion[]
  replies: AdminReply[]
  sanctions: AdminSanction[]
}

export async function getAdminId(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  return user?.publicMetadata?.role === 'admin' ? userId : null
}

export async function isAdmin() {
  return (await getAdminId()) !== null
}
