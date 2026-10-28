'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { SignInButton, useUser } from '@clerk/nextjs'
import { deleteQuestion, getFeed, postQuestion, postReply, vote } from '@/app/actions'
import type { ActionResult, Choice, Feed, FeedQuestion } from '@/lib/types'

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Study Advice', 'Other']

const RANKS = [
  { level: 1, title: 'Novice Scholar', exp: 0, avatar: '📚' },
  { level: 2, title: 'Apprentice', exp: 100, avatar: '📘' },
  { level: 3, title: 'Knowledge Seeker', exp: 250, avatar: '🔎' },
  { level: 4, title: 'Adept Scholar', exp: 450, avatar: '🪶' },
  { level: 5, title: 'Expert', exp: 700, avatar: '📖' },
  { level: 6, title: 'Master Scholar', exp: 1000, avatar: '🔮' },
  { level: 7, title: 'Grand Scholar', exp: 1400, avatar: '🏅' },
  { level: 8, title: 'Sage', exp: 1900, avatar: '🌟' },
  { level: 9, title: 'Grand Sage', exp: 2500, avatar: '💎' },
  { level: 10, title: 'Legendary Scholar', exp: 3200, avatar: '👑' },
]

function handleResult(result: ActionResult) {
  if (!result.ok) {
    alert(result.message ?? 'Something went wrong.')
    return false
  }
  if (result.earned === 0) alert('Daily EXP limit reached. Try again tomorrow!')
  else if (result.earned) alert('+' + result.earned + ' EXP earned!')
  return true
}

function VoteControls(props: {
  up: number
  down: number
  mine: Choice | null
  onVote: (choice: Choice) => void
}) {
  const { up, down, mine, onVote } = props
  return (
    <div className="vote-controls">
      <button
        type="button"
        className={'vote-button' + (mine === 'up' ? ' is-selected' : '')}
        aria-label="Upvote"
        aria-pressed={mine === 'up'}
        onClick={() => onVote('up')}
      >
        ▲ {up}
      </button>
      <button
        type="button"
        className={'vote-button' + (mine === 'down' ? ' is-selected' : '')}
        aria-label="Downvote"
        aria-pressed={mine === 'down'}
        onClick={() => onVote('down')}
      >
        ▼ {down}
      </button>
    </div>
  )
}

function ReplyForm(props: { questionId: string; title: string; onDone: () => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!text.trim()) {
      alert('Please write a reply first.')
      return
    }
    setBusy(true)
    const result = await postReply({ questionId: props.questionId, body: text })
    setBusy(false)
    if (handleResult(result)) {
      setText('')
      props.onDone()
    }
  }

  return (
    <form className="reply-form" onSubmit={submit}>
      <textarea
        placeholder="Write a helpful reply..."
        rows={2}
        required
        maxLength={1000}
        aria-label={'Reply to ' + props.title}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" disabled={busy}>
        Post Reply
      </button>
    </form>
  )
}

function QuestionCard(props: { q: FeedQuestion; onChanged: () => void }) {
  const { q, onChanged } = props

  async function castVote(targetType: 'question' | 'reply', targetId: string, choice: Choice) {
    const result = await vote({ targetType, targetId, choice })
    if (handleResult(result)) onChanged()
  }

  async function remove() {
    if (!confirm('Are you sure you want to delete this question and all its replies?')) return
    const result = await deleteQuestion(q.id)
    if (handleResult(result)) onChanged()
  }

  return (
    <article className="posted-question">
      <h4>{q.title}</h4>
      <p>
        Subject: {q.subject} · Asked by {q.author}
      </p>
      <p>{q.details}</p>

      {q.isOwner && (
        <button type="button" className="delete-post-button" onClick={remove}>
          Delete Post
        </button>
      )}

      <VoteControls
        up={q.up}
        down={q.down}
        mine={q.mine}
        onVote={(choice) => castVote('question', q.id, choice)}
      />

      <h5>Replies ({q.replies.length})</h5>
      <div className="reply-list">
        {q.replies.length === 0 ? (
          <p>No replies yet. Start the discussion!</p>
        ) : (
          q.replies.map((reply) => (
            <div className="reply-card" key={reply.id}>
              <p>{reply.text}</p>
              <small>
                {reply.author} · {new Date(reply.date).toLocaleString()}
              </small>
              <VoteControls
                up={reply.up}
                down={reply.down}
                mine={reply.mine}
                onVote={(choice) => castVote('reply', reply.id, choice)}
              />
            </div>
          ))
        )}
      </div>

      <ReplyForm questionId={q.id} title={q.title} onDone={onChanged} />
    </article>
  )
}

export default function AcademicHub() {
  const { isSignedIn } = useUser()
  const [feed, setFeed] = useState<Feed>({ questions: [], exp: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')

  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [details, setDetails] = useState('')
  const [posting, setPosting] = useState(false)

  const refresh = useCallback(async () => {
    const data = await getFeed()
    setFeed(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 20000)
    return () => clearInterval(timer)
  }, [refresh, isSignedIn])

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase()
    return feed.questions.filter((q) => {
      const haystack = (
        q.title + ' ' + q.details + ' ' + q.subject + ' ' + q.replies.map((r) => r.text).join(' ')
      ).toLowerCase()
      return haystack.includes(text) && (subjectFilter === 'all' || q.subject === subjectFilter)
    })
  }, [feed.questions, search, subjectFilter])

  async function submitQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim() || !subject || !details.trim()) {
      alert('Please complete all fields.')
      return
    }
    setPosting(true)
    const result = await postQuestion({ title, subject, details })
    setPosting(false)
    if (handleResult(result)) {
      setTitle('')
      setSubject('')
      setDetails('')
      refresh()
    }
  }

  // Rank and progress
  const exp = feed.exp
  let current = RANKS[0]
  let next: (typeof RANKS)[number] | null = null
  for (let i = 0; i < RANKS.length; i++) {
    if (exp >= RANKS[i].exp) current = RANKS[i]
    else {
      next = RANKS[i]
      break
    }
  }
  const earned = next ? exp - current.exp : exp
  const needed = next ? next.exp - current.exp : exp
  const percent = next ? Math.min(100, (earned / needed) * 100) : 100

  return (
    <main>
      {/* SCHOLAR PROFILE AND EXP */}
      <section id="player-profile" className="player-profile">
        <div className="profile-header">
          <div>
            <p className="profile-eyebrow">ACADEMIC HUB // CHARACTER STATUS</p>
            <h2>⚔️ Scholar Profile</h2>
          </div>
          <span className="profile-class">STUDENT</span>
        </div>

        <div className="profile-info">
          <div className="avatar-frame">
            <div id="player-avatar" className="player-avatar">
              {current.avatar}
            </div>
            <span className="avatar-status">ACTIVE</span>
          </div>

          <div className="profile-details">
            <p className="profile-rank-label">CURRENT RANK</p>
            <h3 id="player-title">{current.title}</h3>
            <p id="player-level" className="level-badge">
              Level {current.level}
            </p>
            <p id="player-exp" className="total-exp">
              {exp} EXP
            </p>
          </div>
        </div>

        <div className="exp-info">
          <div className="exp-labels">
            <span id="exp-progress-label">
              {next ? 'Progress to ' + next.title : 'Maximum title milestone reached!'}
            </span>
            <span id="exp-progress-numbers">
              {next ? earned + ' / ' + needed + ' EXP' : exp + ' EXP'}
            </span>
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

          <p className="exp-footer">✦ Every contribution builds your knowledge.</p>
        </div>

        <div className="profile-footer">
          <span>◈ KNOWLEDGE</span>
          <span>◈ CONSISTENCY</span>
          <span>◈ GROWTH</span>
        </div>
      </section>

      {/* HOME */}
      <section id="home" className="hero">
        <h2>Learn Together. Improve Together.</h2>
        <p>Your community for academic advice, questions, and learning.</p>
        <a href="#questions" className="main-button">
          Explore Questions
        </a>
      </section>

      {/* SUBJECTS */}
      <section id="subjects">
        <h2>Explore Subjects</h2>
        <div className="subject-container">
          <article className="subject-card">
            <h3>📐 Mathematics</h3>
            <p>Ask questions, solve problems, and understand concepts.</p>
          </article>
          <article className="subject-card">
            <h3>🧬 Science</h3>
            <p>Explore scientific ideas and discuss discoveries.</p>
          </article>
          <article className="subject-card">
            <h3>📖 English</h3>
            <p>Improve your grammar, writing, and communication.</p>
          </article>
          <article className="subject-card">
            <h3>🎓 Study Advice</h3>
            <p>Share study methods and learn from other students.</p>
          </article>
        </div>
      </section>

      {/* QUESTIONS */}
      <section id="questions" className="questions">
        <h2>Academic Discussions</h2>
        <p>Ask a question and share what you want to learn.</p>

        {!isSignedIn && (
          <p>
            Sign in to post, reply, vote, and earn EXP.{' '}
            <SignInButton mode="modal">
              <button type="button">Sign in</button>
            </SignInButton>
          </p>
        )}

        <form id="question-form" onSubmit={submitQuestion}>
          <label htmlFor="question-title">Question title</label>
          <input
            type="text"
            id="question-title"
            placeholder="e.g. How do I improve at Mathematics?"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label htmlFor="question-subject">Subject</label>
          <select
            id="question-subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">Choose a subject</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label htmlFor="question-details">Details</label>
          <textarea
            id="question-details"
            placeholder="Explain what you need help with..."
            rows={4}
            required
            maxLength={5000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          ></textarea>

          <button type="submit" disabled={posting}>
            Post Question
          </button>
        </form>

        <div className="discussion-tools">
          <label htmlFor="question-search">Find a discussion</label>
          <input
            id="question-search"
            type="search"
            placeholder="Search questions or keywords..."
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <label htmlFor="subject-filter">Filter by subject</label>
          <select
            id="subject-filter"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="all">All subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <p id="discussion-count" aria-live="polite">
            {loading
              ? 'Loading questions...'
              : 'Showing ' + filtered.length + ' of ' + feed.questions.length + ' questions'}
          </p>
        </div>

        <div id="question-list">
          <h3>Recent Questions</h3>
          {!loading && feed.questions.length === 0 && (
            <p>No questions yet. Be the first to ask!</p>
          )}
          {!loading && feed.questions.length > 0 && filtered.length === 0 && (
            <p>No matching questions found. Try another search or subject.</p>
          )}
          {filtered.map((q) => (
            <QuestionCard key={q.id} q={q} onChanged={refresh} />
          ))}
        </div>
      </section>
    </main>
  )
}
