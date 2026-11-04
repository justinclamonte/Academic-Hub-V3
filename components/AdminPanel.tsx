'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { SignInButton, useUser } from '@clerk/nextjs'
import {
  adminDeleteQuestion,
  adminDeleteReply,
  adminLiftSanction,
  adminReview,
  adminSanction,
  getAdminData,
  getAdminUsers,
} from '@/app/admin/actions'
import type { AdminData, AdminUser } from '@/lib/admin'

const box: CSSProperties = { border: '1px solid #8884', borderRadius: 8, padding: 16 }
const cell: CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '1px solid #8883',
  verticalAlign: 'top',
}

export default function AdminPanel() {
    const { isSignedIn } = useUser()
  const [data, setData] = useState<AdminData | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setData(await getAdminData())
    } catch (error) {
      console.error('Could not load admin data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      setUsers(await getAdminUsers())
      setUsersLoaded(true)
    } catch (error) {
      console.error('Could not load users:', error)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, isSignedIn])

  async function act(promise: Promise<{ ok: boolean; message?: string }>) {
    const result = await promise
    if (!result.ok) alert(result.message ?? 'Something went wrong.')
    load()
    if (usersLoaded) loadUsers()
  }

  function suspend(userId: string, userName: string) {
    const days = Number(prompt('Suspend ' + userName + ' for how many days?', '7'))
    if (!Number.isFinite(days) || days < 1) return
    const reason = prompt('Reason (optional)') ?? ''
    act(adminSanction({ userId, userName, kind: 'suspended', days, reason }))
  }

  function ban(userId: string, userName: string) {
    if (!confirm('Permanently ban ' + userName + ' from posting?')) return
    const reason = prompt('Reason (optional)') ?? ''
    act(adminSanction({ userId, userName, kind: 'banned', reason }))
  }

  function userActions(userId: string, userName: string) {
    return (
      <>
        <button type="button" onClick={() => suspend(userId, userName)}>Suspend</button>{' '}
        <button type="button" onClick={() => ban(userId, userName)}>Ban</button>
      </>
    )
  }

  if (loading) return <main style={{ padding: 24 }}>Loading...</main>

  if (!isSignedIn) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Academic Hub Admin</h1>
        <p>Please sign in with your admin account.</p>
        <SignInButton mode="modal">
          <button type="button">Sign in</button>
        </SignInButton>
      </main>
    )
  }

  if (!data || !data.allowed) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Academic Hub Admin</h1>
        <p>This account does not have admin access.</p>
      </main>
    )
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1>🛠️ Academic Hub Admin</h1>

      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div style={box}><strong>{data.stats.pending}</strong><br />Awaiting review</div>
        <div style={box}><strong>{data.stats.questions}</strong><br />Questions</div>
        <div style={box}><strong>{data.stats.replies}</strong><br />Replies</div>
        <div style={box}><strong>{data.stats.votes}</strong><br />Votes</div>
        <div style={box}><strong>{data.stats.players}</strong><br />Players with EXP</div>
      </section>

      <section style={box}>
        <h2>⏳ Review queue ({data.pending.length})</h2>
        {data.pending.length === 0 && <p>Nothing waiting for review.</p>}
        {data.pending.map((q) => (
          <article key={q.id} style={{ ...box, marginBottom: 12 }}>
            <h3>{q.title}</h3>
            <p>
              {q.subject} · by {q.author} · {new Date(q.date).toLocaleString()}
            </p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{q.details}</p>
            <button type="button" onClick={() => act(adminReview(q.id, 'approve'))}>✅ Approve</button>{' '}
            <button type="button" onClick={() => act(adminReview(q.id, 'reject'))}>🚫 Reject</button>{' '}
            {userActions(q.authorId, q.author)}
          </article>
        ))}
      </section>

      <section style={box}>
                <h2>👥 Users ({users.length})</h2>
        {!usersLoaded && (
          <button type="button" onClick={loadUsers} disabled={usersLoading}>
            {usersLoading ? 'Loading users...' : 'Load users'}
          </button>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={cell}>Name</th>
                <th style={cell}>Email</th>
                <th style={cell}>EXP</th>
                <th style={cell}>Status</th>
                <th style={cell}>Joined</th>
                <th style={cell}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.userId}>
                  <td style={cell}>{u.name}</td>
                  <td style={cell}>{u.email}</td>
                  <td style={cell}>{u.exp}</td>
                  <td style={cell}>
                    {u.status === 'banned'
                      ? '🚫 Banned'
                      : u.status === 'suspended'
                        ? '⏸️ Suspended until ' + (u.until ? new Date(u.until).toLocaleString() : '')
                        : 'Active'}
                  </td>
                  <td style={cell}>{new Date(u.joined).toLocaleDateString()}</td>
                  <td style={cell}>
                    {u.status === 'active' ? (
                      userActions(u.userId, u.name)
                    ) : (
                      <button type="button" onClick={() => act(adminLiftSanction(u.userId))}>Lift</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={box}>
        <h2>Suspended and banned users</h2>
        {data.sanctions.length === 0 ? (
          <p>No one is suspended or banned.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={cell}>User</th>
                  <th style={cell}>Action</th>
                  <th style={cell}>Until</th>
                  <th style={cell}>Reason</th>
                  <th style={cell}></th>
                </tr>
              </thead>
              <tbody>
                {data.sanctions.map((s) => (
                  <tr key={s.userId}>
                    <td style={cell}>{s.userName}</td>
                    <td style={cell}>
                      {s.kind === 'banned' ? 'Banned' : s.active ? 'Suspended' : 'Suspension ended'}
                    </td>
                    <td style={cell}>
                      {s.kind === 'banned' ? 'Permanent' : s.until ? new Date(s.until).toLocaleString() : ''}
                    </td>
                    <td style={cell}>{s.reason ?? ''}</td>
                    <td style={cell}>
                      <button type="button" onClick={() => act(adminLiftSanction(s.userId))}>
                        {s.active ? 'Lift' : 'Clear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={box}>
        <h2>Published and rejected questions (latest 200)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={cell}>Title</th>
                <th style={cell}>Status</th>
                <th style={cell}>Author</th>
                <th style={cell}>Date</th>
                <th style={cell}></th>
              </tr>
            </thead>
            <tbody>
              {data.questions.map((q) => (
                <tr key={q.id}>
                  <td style={cell}>{q.title}</td>
                  <td style={cell}>{q.status}</td>
                  <td style={cell}>{q.author}</td>
                  <td style={cell}>{new Date(q.date).toLocaleString()}</td>
                  <td style={cell}>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this question and its replies?')) act(adminDeleteQuestion(q.id))
                      }}
                    >
                      Delete
                    </button>{' '}
                    {userActions(q.authorId, q.author)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={box}>
        <h2>Replies (latest 200)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={cell}>Reply</th>
                <th style={cell}>On question</th>
                <th style={cell}>Author</th>
                <th style={cell}>Date</th>
                <th style={cell}></th>
              </tr>
            </thead>
            <tbody>
              {data.replies.map((r) => (
                <tr key={r.id}>
                  <td style={cell}>{r.body}</td>
                  <td style={cell}>{r.questionTitle}</td>
                  <td style={cell}>{r.author}</td>
                  <td style={cell}>{new Date(r.date).toLocaleString()}</td>
                  <td style={cell}>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this reply?')) act(adminDeleteReply(r.id))
                      }}
                    >
                      Delete
                    </button>{' '}
                    {userActions(r.authorId, r.author)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}