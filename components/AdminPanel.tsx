'use client'

import { useCallback, useEffect, useState } from 'react'
import { SignInButton, useUser } from '@clerk/nextjs'
import { adminDeleteQuestion, adminDeleteReply, getAdminData } from '@/app/admin/actions'
import type { AdminData } from '@/lib/admin'

const box: React.CSSProperties = { border: '1px solid #8884', borderRadius: 8, padding: 16 }
const cell: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '1px solid #8883',
  verticalAlign: 'top',
}

export default function AdminPanel() {
  const { isSignedIn } = useUser()
  const [data, setData] = useState<AdminData | null>(null)
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

  useEffect(() => {
    load()
  }, [load, isSignedIn])

  async function removeQuestion(id: string) {
    if (!confirm('Delete this question and all its replies?')) return
    const result = await adminDeleteQuestion(id)
    if (!result.ok) alert(result.message)
    load()
  }

  async function removeReply(id: string) {
    if (!confirm('Delete this reply?')) return
    const result = await adminDeleteReply(id)
    if (!result.ok) alert(result.message)
    load()
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

      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div style={box}><strong>{data.stats.questions}</strong><br />Questions</div>
        <div style={box}><strong>{data.stats.replies}</strong><br />Replies</div>
        <div style={box}><strong>{data.stats.votes}</strong><br />Votes</div>
        <div style={box}><strong>{data.stats.players}</strong><br />Players with EXP</div>
      </section>

      <section style={box}>
        <h2>Questions (latest 200)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={cell}>Title</th>
                <th style={cell}>Subject</th>
                <th style={cell}>Author</th>
                <th style={cell}>Date</th>
                <th style={cell}></th>
              </tr>
            </thead>
            <tbody>
              {data.questions.map((q) => (
                <tr key={q.id}>
                  <td style={cell}>{q.title}</td>
                  <td style={cell}>{q.subject}</td>
                  <td style={cell}>{q.author}</td>
                  <td style={cell}>{new Date(q.date).toLocaleString()}</td>
                  <td style={cell}>
                    <button type="button" onClick={() => removeQuestion(q.id)}>Delete</button>
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
                    <button type="button" onClick={() => removeReply(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={box}>
        <h2>Top players by EXP</h2>
        <ol>
          {data.topPlayers.map((p) => (
            <li key={p.userId}>
              {p.userId} — {p.exp} EXP
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}