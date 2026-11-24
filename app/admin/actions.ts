'use server'

import { clerkClient } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { awardExp } from '@/lib/exp'
import { getAdminId, isAdmin } from '@/lib/admin'
import type { AdminData, AdminQuestion, AdminUser } from '@/lib/admin'
import type { ActionResult } from '@/lib/types'

const EMPTY: AdminData = {
  allowed: false,
  stats: { pending: 0, questions: 0, replies: 0, votes: 0, players: 0 },
  pending: [],
  questions: [],
  replies: [],
  sanctions: [],
}

async function count(table: string) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return count ?? 0
}

const QUESTION_COLUMNS = 'id, title, subject, details, author_id, author_name, created_at, status'

function toAdminQuestion(row: Record<string, string>): AdminQuestion {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    details: row.details,
    author: row.author_name || 'Student',
    authorId: row.author_id,
    date: row.created_at,
    status: row.status,
  }
}

export async function getAdminData(): Promise<AdminData> {
  if (!(await isAdmin())) return EMPTY

  const [pending, others, replies, sanctions, nPending, nQuestions, nReplies, nVotes, nPlayers] =
    await Promise.all([
      supabase.from('hub_questions').select(QUESTION_COLUMNS).eq('status', 'pending').order('created_at', { ascending: true }),
      supabase.from('hub_questions').select(QUESTION_COLUMNS).neq('status', 'pending').order('created_at', { ascending: false }).limit(200),
      supabase.from('hub_replies').select('id, body, author_id, author_name, created_at, question_id, verified').order('created_at', { ascending: false }).limit(200),
      supabase.from('hub_sanctions').select('*').order('created_at', { ascending: false }),
      supabase.from('hub_questions').select('*', { count: 'exact', head: true }).eq('status', 'pending').then((res) => res.count ?? 0),
      count('hub_questions'),
      count('hub_replies'),
      count('hub_votes'),
      count('hub_profiles'),
    ])

  if (pending.error || others.error || replies.error || sanctions.error) {
    console.error('getAdminData error:', pending.error ?? others.error ?? replies.error ?? sanctions.error)
    return { ...EMPTY, allowed: true }
  }

  const titles = new Map<string, string>(others.data.map((row) => [row.id, row.title]))
  for (const row of pending.data) titles.set(row.id, row.title)
  const now = new Date()

  return {
    allowed: true,
    stats: { pending: nPending, questions: nQuestions, replies: nReplies, votes: nVotes, players: nPlayers },
    pending: pending.data.map(toAdminQuestion),
    questions: others.data.map(toAdminQuestion),
    replies: replies.data.map((row) => ({
      id: row.id,
      body: row.body,
      author: row.author_name || 'Student',
      authorId: row.author_id,
      date: row.created_at,
      questionTitle: titles.get(row.question_id) ?? '(older question)',
      verified: row.verified ?? false,
    })),
    sanctions: sanctions.data.map((row) => ({
      userId: row.user_id,
      userName: row.user_name || 'Student',
      kind: row.kind,
      until: row.until,
      reason: row.reason,
      active: row.kind === 'banned' || (!!row.until && new Date(row.until) > now),
    })),
  }
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  if (!(await isAdmin())) return []

  const client = await clerkClient()
  const list = await client.users.getUserList({ limit: 100, orderBy: '-created_at' })

  const [sanctions, profiles] = await Promise.all([
    supabase.from('hub_sanctions').select('user_id, kind, until'),
    supabase.from('hub_profiles').select('user_id, exp'),
  ])

  const sanctionBy = new Map<string, { kind: string; until: string | null }>()
  for (const s of sanctions.data ?? []) sanctionBy.set(s.user_id, s)
  const expBy = new Map<string, number>()
  for (const p of profiles.data ?? []) expBy.set(p.user_id, p.exp)

  const now = new Date()

  return list.data.map((user) => {
    const s = sanctionBy.get(user.id)
    let status: AdminUser['status'] = 'active'
    if (s?.kind === 'banned') status = 'banned'
    else if (s?.until && new Date(s.until) > now) status = 'suspended'

    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      ''
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || email || 'Student'

    return {
      userId: user.id,
      name,
      email,
      joined: new Date(user.createdAt).toISOString(),
      exp: expBy.get(user.id) ?? 0,
      status,
      until: s?.until ?? null,
    }
  })
}

export async function adminReview(id: string, decision: 'approve' | 'reject'): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, message: 'Not authorized.' }

  const { data, error } = await supabase
    .from('hub_questions')
    .update({ status: decision === 'approve' ? 'approved' : 'rejected' })
    .eq('id', id)
    .eq('status', 'pending')
    .select('author_id')
  if (error) {
    console.error('adminReview error:', error)
    return { ok: false, message: 'Could not save the review.' }
  }
  if (!data || data.length === 0) return { ok: false, message: 'This question was already reviewed.' }

  if (decision === 'approve') await awardExp(data[0].author_id, 'question')
  return { ok: true }
}

export async function adminDeleteQuestion(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, message: 'Not authorized.' }
  const { error } = await supabase.from('hub_questions').delete().eq('id', id)
  if (error) {
    console.error('adminDeleteQuestion error:', error)
    return { ok: false, message: 'Could not delete this question.' }
  }
  return { ok: true }
}

export async function adminDeleteReply(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, message: 'Not authorized.' }
  const { error } = await supabase.from('hub_replies').delete().eq('id', id)
  if (error) {
    console.error('adminDeleteReply error:', error)
    return { ok: false, message: 'Could not delete this reply.' }
  }
  return { ok: true }
}

export async function adminSanction(input: {
  userId: string
  userName: string
  kind: 'suspended' | 'banned'
  days?: number
  reason?: string
}): Promise<ActionResult> {
  const adminId = await getAdminId()
  if (!adminId) return { ok: false, message: 'Not authorized.' }
  if (input.userId === adminId) return { ok: false, message: "You can't sanction your own account." }

  const days = Math.floor(Number(input.days))
  if (input.kind === 'suspended' && !(days >= 1 && days <= 365)) {
    return { ok: false, message: 'Enter a number of days from 1 to 365.' }
  }

  const { error } = await supabase.from('hub_sanctions').upsert({
    user_id: input.userId,
    user_name: input.userName.slice(0, 100),
    kind: input.kind,
    until: input.kind === 'suspended' ? new Date(Date.now() + days * 86400000).toISOString() : null,
    reason: (input.reason ?? '').trim().slice(0, 300) || null,
  })
  if (error) {
    console.error('adminSanction error:', error)
    return { ok: false, message: 'Could not save this action.' }
  }
  return { ok: true }
}

export async function adminLiftSanction(userId: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, message: 'Not authorized.' }
  const { error } = await supabase.from('hub_sanctions').delete().eq('user_id', userId)
  if (error) {
    console.error('adminLiftSanction error:', error)
    return { ok: false, message: 'Could not lift this action.' }
  }
  return { ok: true }
}
export async function adminVerifyReply(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, message: 'Not authorized.' }

  // Mark it verified first, so a double click can never pay twice.
  const { data, error } = await supabase
    .from('hub_replies')
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq('id', id)
    .eq('verified', false)
    .select('author_id')
  if (error) {
    console.error('adminVerifyReply error:', error)
    return { ok: false, message: 'Could not verify this reply.' }
  }
  if (!data || data.length === 0) return { ok: false, message: 'This reply is already verified.' }

  const { error: coinError } = await supabase.rpc('add_coins', {
    p_user: data[0].author_id,
    p_amount: 10,
  })
  if (coinError) {
    console.error('adminVerifyReply coin error:', coinError)
    await supabase.from('hub_replies').update({ verified: false, verified_at: null }).eq('id', id)
    return { ok: false, message: 'Could not add the coins. Please try again.' }
  }
  return { ok: true }
}