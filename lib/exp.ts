import { supabase } from '@/lib/supabase'

const REWARDS = {
  question: { amount: 5, limit: 3, field: 'daily_questions' },
  reply: { amount: 5, limit: 5, field: 'daily_replies' },
} as const

type Profile = {
  user_id: string
  exp: number
  coins: number
  avatar_id: string | null
  daily_date: string | null
  daily_questions: number
  daily_replies: number
  daily_votes: number
  daily_helpful: number
}

export async function awardExp(userId: string, action: keyof typeof REWARDS) {
  const reward = REWARDS[action]
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('hub_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const profile: Profile = data ?? {
    user_id: userId,
    exp: 0,
    coins: 0,
    avatar_id: null,
    daily_date: today,
    daily_questions: 0,
    daily_replies: 0,
    daily_votes: 0,
    daily_helpful: 0,
  }

  if (profile.daily_date !== today) {
    profile.daily_date = today
    profile.daily_questions = 0
    profile.daily_replies = 0
    profile.daily_votes = 0
    profile.daily_helpful = 0
  }

  if (profile[reward.field] >= reward.limit) {
    await supabase.from('hub_profiles').upsert(profile)
    return 0
  }

  profile[reward.field] += 1
  profile.exp += reward.amount
  profile.coins += reward.amount
  await supabase.from('hub_profiles').upsert(profile)
  return reward.amount
}