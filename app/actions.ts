'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import type { ActionResult, Choice, Feed, FeedQuestion } from '@/lib/types'

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Study Advice', 'Other']

const REWARDS = {
  question: { amount: 5, limit: 3, field: 'daily_questions' },
  reply: { amount: 5, limit: 5, field: 'daily_replies' },
} as const

type Profile = {
  user_id: string
  exp: number
  daily_date: string | null
  daily_questions: number
  daily_replies: number
  daily_votes: number
  daily_helpful: number
}

async function awardExp(userId: string, action: keyof typeof REWARDS) {
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
  await supabase.from('hub_profiles').upsert(profile)
  return reward.amount
}

async function displayName() {
  const user = await currentUser()
  return user?.firstName || user?.username || 'Student'
}

export async function getFeed(): Promise<Feed> {
  const { userId } = await auth()

  const [q, r, v] = await Promise.all([
    supabase.from('hub_questions').select('*').order('created_at', { ascending: false }),
    supabase.from('hub_replies').select('*').order('created_at', { ascending: true }),
    supabase.from('hub_votes').select('user_id, target_type, target_id, choice'),
  ])

  if (q.error || r.error || v.error) {
    console.error('getFeed error:', q.error ?? r.error ?? v.error)
    return { questions: [], exp: 0 }
  }

  const tally = new Map<string, { up: number; down: number; mine: Choice | null }>()
  for (const row of v.data) {
    const key = `${row.target_type}:${row.target_id}`
    const t = tally.get(key) ?? { up: 0, down: 0, mine: null }
    if (row.choice === 'up') t.up += 1
    else t.down += 1
    if (userId && row.user_id === userId) t.mine = row.choice as Choice
    tally.set(key, t)
  }
  const votesFor = (type: string, id: string) =>
    tally.get(`${type}:${id}`) ?? { up: 0, down: 0, mine: null }

  const questions: FeedQuestion[] = q.data.map((row) => ({
    id: row.id,
    title: row.title,
    subject: row.subject,
    details: row.details,
    author: row.author_name || 'Student',
    date: row.created_at,
    isOwner: !!userId && row.author_id === userId,
    ...votesFor('question', row.id),
    replies: r.data
      .filter((rep) => rep.question_id === row.id)
      .map((rep) => ({
        id: rep.id,
        text: rep.body,
        author: rep.author_name || 'Student',
        date: rep.created_at,
        ...votesFor('reply', rep.id),
      })),
  }))

  let exp = 0
  if (userId) {
    const { data } = await supabase
      .from('hub_profiles')
      .select('exp')
      .eq('user_id', userId)
      .maybeSingle()
    exp = data?.exp ?? 0
  }

  return { questions, exp }
}

export async function postQuestion(input: {
  title: string
  subject: string
  details: string
}): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, message: 'Please sign in to post a question.' }

  const title = input.title.trim().slice(0, 200)
  const details = input.details.trim().slice(0, 5000)
  if (!title || !details || !SUBJECTS.includes(input.subject)) {
    return { ok: false, message: 'Please complete all fields.' }
  }

  const { error } = await supabase.from('hub_questions').insert({
    author_id: userId,
    author_name: await displayName(),
    title,
    subject: input.subject,
    details,
  })
  if (error) {
    console.error('postQuestion error:', error)
    return { ok: false, message: 'Your question could not be saved. Please try again.' }
  }

  return { ok: true, earned: await awardExp(userId, 'question') }
}

export async function postReply(input: {
  questionId: string
  body: string
}): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, message: 'Please sign in to reply.' }

  const body = input.body.trim().slice(0, 1000)
  if (!body) return { ok: false, message: 'Please write a reply first.' }

  const { error } = await supabase.from('hub_replies').insert({
    question_id: input.questionId,
    author_id: userId,
    author_name: await displayName(),
    body,
  })
  if (error) {
    console.error('postReply error:', error)
    return { ok: false, message: 'Your reply could not be saved. Please try again.' }
  }

  return { ok: true, earned: await awardExp(userId, 'reply') }
}

export async function vote(input: {
  targetType: 'question' | 'reply'
  targetId: string
  choice: Choice
}): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, message: 'Please sign in to vote.' }

  const { data: existing, error: readError } = await supabase
    .from('hub_votes')
    .select('choice')
    .eq('user_id', userId)
    .eq('target_type', input.targetType)
    .eq('target_id', input.targetId)
    .maybeSingle()
  if (readError) {
    console.error('vote read error:', readError)
    return { ok: false, message: 'Could not save the vote. Please try again.' }
  }

  // Tapping the same vote again removes it.
  const result =
    existing?.choice === input.choice
      ? await supabase
          .from('hub_votes')
          .delete()
          .eq('user_id', userId)
          .eq('target_type', input.targetType)
          .eq('target_id', input.targetId)
      : await supabase.from('hub_votes').upsert({
          user_id: userId,
          target_type: input.targetType,
          target_id: input.targetId,
          choice: input.choice,
        })

  if (result.error) {
    console.error('vote write error:', result.error)
    return { ok: false, message: 'Could not save the vote. Please try again.' }
  }
  return { ok: true }
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, message: 'Please sign in first.' }

  const { error } = await supabase
    .from('hub_questions')
    .delete()
    .eq('id', id)
    .eq('author_id', userId)
  if (error) {
    console.error('deleteQuestion error:', error)
    return { ok: false, message: 'Could not delete this question.' }
  }
  return { ok: true }
}
