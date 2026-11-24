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