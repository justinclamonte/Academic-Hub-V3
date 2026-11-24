export type Choice = 'up' | 'down'

export type FeedReply = {
  id: string
  text: string
  author: string
  date: string
  up: number
  down: number
  mine: Choice | null
  verified: boolean
}

export type FeedQuestion = {
    status: 'pending' | 'approved' | 'rejected'
  id: string
  title: string
  subject: string
  details: string
  author: string
  date: string
  up: number
  down: number
  mine: Choice | null
  isOwner: boolean
  replies: FeedReply[]
}

export type Feed = { questions: FeedQuestion[]; exp: number }

export type ActionResult = { ok: boolean; message?: string; earned?: number }
export type ShopState = { coins: number; owned: string[]; equipped: string | null }

export type DashboardData = {
  signedIn: boolean
  name: string
  email: string
  imageUrl: string
  joined: string
  exp: number
  coins: number
  avatarId: string | null
  avatarsOwned: number
  totals: { questions: number; replies: number; verified: number }
  questions: { id: string; title: string; subject: string; status: string; date: string; replies: number }[]
  replies: { id: string; body: string; date: string; questionTitle: string; verified: boolean }[]
}