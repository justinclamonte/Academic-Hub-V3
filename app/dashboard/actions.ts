'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import type { DashboardData } from '@/lib/types'

const EMPTY: DashboardData = {
  signedIn: false,
  name: '',
  email: '',
  imageUrl: '',
  joined: '',
  exp: 0,
  coins: 0,
  avatarId: null,
  avatarsOwned: 0,
  totals: { questions: 0, replies: 0, verified: 0 },
  questions: [],
  replies: [],
}

export async function getDashboard(): Promise<DashboardData> {
  const { userId } = await auth()
  if (!userId) return EMPTY

  const user = await currentUser()

  const [profile, owned, qs, rs, nQuestions, nReplies, nVerified] = await Promise.all([
    supabase.from('hub_profiles').select('exp, coins, avatar_id').eq('user_id', userId).maybeSingle(),
    supabase.from('hub_avatars_owned').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('hub_questions')
      .select('id, title, subject, status, created_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('hub_replies')
      .select('id, body, question_id, created_at, verified')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('hub_questions').select('*', { count: 'exact', head: true }).eq('author_id', userId),
    supabase.from('hub_replies').select('*', { count: 'exact', head: true }).eq('author_id', userId),
    supabase
      .from('hub_replies')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId)
      .eq('verified', true),
  ])

  if (qs.error || rs.error) {
    console.error('getDashboard error:', qs.error ?? rs.error)
  }

  const questionRows = qs.data ?? []
  const replyRows = rs.data ?? []

  // Reply counts for the user's own questions.
  const replyCounts = new Map<string, number>()
  const questionIds = questionRows.map((q) => q.id)
  if (questionIds.length > 0) {
    const { data } = await supabase.from('hub_replies').select('question_id').in('question_id', questionIds)
    for (const row of data ?? []) {
      replyCounts.set(row.question_id, (replyCounts.get(row.question_id) ?? 0) + 1)
    }
  }

  // Titles of the questions the user replied to.
  const titles = new Map<string, string>()
  const repliedIds = [...new Set(replyRows.map((r) => r.question_id as string))]
  if (repliedIds.length > 0) {
    const { data } = await supabase.from('hub_questions').select('id, title').in('id', repliedIds)
    for (const row of data ?? []) titles.set(row.id, row.title)
  }

  const email =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    ''
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || email || 'Student'

  return {
    signedIn: true,
    name,
    email,
    imageUrl: user?.imageUrl ?? '',
    joined: user ? new Date(user.createdAt).toISOString() : '',
    exp: profile.data?.exp ?? 0,
    coins: profile.data?.coins ?? 0,
    avatarId: profile.data?.avatar_id ?? null,
    avatarsOwned: owned.count ?? 0,
    totals: {
      questions: nQuestions.count ?? 0,
      replies: nReplies.count ?? 0,
      verified: nVerified.count ?? 0,
    },
    questions: questionRows.map((q) => ({
      id: q.id,
      title: q.title,
      subject: q.subject,
      status: q.status,
      date: q.created_at,
      replies: replyCounts.get(q.id) ?? 0,
    })),
    replies: replyRows.map((r) => ({
      id: r.id,
      body: r.body,
      date: r.created_at,
      questionTitle: titles.get(r.question_id) ?? '(deleted question)',
      verified: r.verified ?? false,
    })),
  }
}