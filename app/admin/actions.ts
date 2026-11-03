'use server'

import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import type { AdminData } from '@/lib/admin'
import type { ActionResult } from '@/lib/types'

const EMPTY: AdminData = {
  allowed: false,
  stats: { questions: 0, replies: 0, votes: 0, players: 0 },
  questions: [],
  replies: [],
  topPlayers: [],
}

async function count(table: string) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return count ?? 0
}

export async function getAdminData(): Promise<AdminData> {
  if (!(await isAdmin())) return EMPTY

  const [q, r, p, nQuestions, nReplies, nVotes, nPlayers] = await Promise.all([
    supabase
      .from('hub_questions')
      .select('id, title, subject, author_name, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('hub_replies')
      .select('id, body, author_name, created_at, question_id')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('hub_profiles').select('user_id, exp').order('exp', { ascending: false }).limit(20),
    count('hub_questions'),
    count('hub_replies'),
    count('hub_votes'),
    count('hub_profiles'),
  ])

  if (q.error || r.error || p.error) {
    console.error('getAdminData error:', q.error ?? r.error ?? p.error)
    return { ...EMPTY, allowed: true }
  }

  const titles = new Map<string, string>(q.data.map((row) => [row.id, row.title]))

  return {
    allowed: true,
    stats: { questions: nQuestions, replies: nReplies, votes: nVotes, players: nPlayers },
    questions: q.data.map((row) => ({
      id: row.id,
      title: row.title,
      subject: row.subject,
      author: row.author_name || 'Student',
      date: row.created_at,
    })),
    replies: r.data.map((row) => ({
      id: row.id,
      body: row.body,
      author: row.author_name || 'Student',
      date: row.created_at,
      questionTitle: titles.get(row.question_id) ?? '(older question)',
    })),
    topPlayers: p.data.map((row) => ({ userId: row.user_id, exp: row.exp })),
  }
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