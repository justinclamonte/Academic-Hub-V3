'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { SignInButton, useUser } from '@clerk/nextjs'
import { getDashboard } from '@/app/dashboard/actions'
import { AVATARS } from '@/lib/avatars'
import { getRank } from '@/lib/ranks'
import type { DashboardData } from '@/lib/types'

const box: CSSProperties = { border: '1px solid #8884', borderRadius: 8, padding: 16 }

const STATUS_LABELS: Record<string, string> = {
  approved: '✅ Published',
  pending: '⏳ Pending review',
  rejected: '🚫 Not approved',
}

export default function DashboardPage() {
  const { isSignedIn } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setData(await getDashboard())
    } catch (error) {
      console.error('Could not load the dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, isSignedIn])

  if (loading) return <main style={{ padding: 24 }}>Loading...</main>

  if (!isSignedIn) {
    return (
      <main style={{ padding: 24 }}>
        <h2>👤 My Dashboard</h2>
        <p>Please sign in to see your dashboard.</p>
        <SignInButton mode="modal">
          <button type="button">Sign in</button>
        </SignInButton>
      </main>
    )
  }

  if (!data || !data.signedIn) {
    return (
      <main style={{ padding: 24 }}>
        <p>Could not load your dashboard. Please refresh the page.</p>
      </main>
    )
  }

  const { current, next } = getRank(data.exp)
  const avatarEmoji = AVATARS.find((a) => a.id === data.avatarId)?.emoji ?? current.avatar
  const earned = next ? data.exp - current.exp : data.exp
  const needed = next ? next.exp - current.exp : data.exp
  const percent = next ? Math.min(100, (earned / needed) * 100) : 100

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section className="player-profile">
        <div className="profile-header">
          <div>
            <p className="profile-eyebrow">ACADEMIC HUB // MY DASHBOARD</p>
            <h2>👤 {data.name}</h2>
          </div>
          <span className="profile-class">STUDENT</span>
        </div>

        <div className="profile-info">
          <div className="avatar-frame">
            <div className="player-avatar">{avatarEmoji}</div>
            <span className="avatar-status">ACTIVE</span>
          </div>

          <div className="profile-details">
            <p className="profile-rank-label">CURRENT RANK</p>
            <h3>{current.title}</h3>
            <p className="level-badge">Level {current.level}</p>
            <p className="total-exp">{data.exp} EXP</p>
            <p className="total-exp">🪙 {data.coins} coins</p>
          </div>
        </div>

        <div className="exp-info">
          <div className="exp-labels">
            <span>{next ? 'Progress to ' + next.title : 'Maximum title milestone reached!'}</span>
            <span>{next ? earned + ' / ' + needed + ' EXP' : data.exp + ' EXP'}</span>
          </div>
          <div
            className="exp-bar"
            role="progressbar"
            aria-label="Experience progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
          >
            <div id="exp-bar-fill" style={{ width: percent + '%' }}></div>
          </div>
        </div>

        <div className="profile-footer">
          <span>✉️ {data.email}</span>
          <span>📅 Joined {data.joined ? new Date(data.joined).toLocaleDateString() : ''}</span>
          <span>🎨 {data.avatarsOwned} avatars owned</span>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div style={box}><strong>{data.totals.questions}</strong><br />Questions posted</div>
        <div style={box}><strong>{data.totals.replies}</strong><br />Replies posted</div>
        <div style={box}><strong>{data.totals.verified}</strong><br />Verified replies</div>
        <div style={box}><strong>{data.avatarsOwned}</strong><br />Avatars owned</div>
      </section>

      <p>
        <Link href="/shop">🛒 Visit the shop</Link> · <Link href="/#questions">💬 Browse questions</Link>
      </p>

      <section style={box}>
        <h2>📝 My latest questions</h2>
        {data.questions.length === 0 ? (
          <p>
            You haven&apos;t posted a question yet. <Link href="/#questions">Ask one</Link>
          </p>
        ) : (
          data.questions.map((q) => (
            <article className="posted-question" key={q.id}>
              <h4>{q.title}</h4>
              <p>
                {q.subject} · {STATUS_LABELS[q.status] ?? q.status} · {q.replies} replies ·{' '}
                {new Date(q.date).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </section>

      <section style={box}>
        <h2>💬 My latest replies</h2>
        {data.replies.length === 0 ? (
          <p>
            You haven&apos;t replied to anyone yet. <Link href="/#questions">Help someone out</Link>
          </p>
        ) : (
          data.replies.map((r) => (
            <div className="reply-card" key={r.id}>
              <p>{r.body}</p>
              <small>
                On &quot;{r.questionTitle}&quot; · {new Date(r.date).toLocaleString()}
              </small>
              {r.verified && <p className="ai-check">✅ Verified by an admin · 🪙 +10 bonus</p>}
            </div>
          ))
        )}
      </section>
    </main>
  )
}