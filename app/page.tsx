import LegacyScripts from '@/components/LegacyScripts'

export default function Home() {
  return (
    <>
      {/* NAVIGATION AND DASHBOARD */}
      <div id="dashboard-section">
        <header className="navbar">
          <h1>📚 Academic Hub</h1>
          <nav>
            <a href="#home">Home</a>
            <a href="#subjects">Subjects</a>
            <a href="#questions">Questions</a>
          </nav>
        </header>

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
                  📚
                </div>
                <span className="avatar-status">ACTIVE</span>
              </div>

              <div className="profile-details">
                <p className="profile-rank-label">CURRENT RANK</p>
                <h3 id="player-title">Novice Scholar</h3>
                <p id="player-level" className="level-badge">Level 1</p>
                <p id="player-exp" className="total-exp">0 EXP</p>
              </div>
            </div>

            <div className="exp-info">
              <div className="exp-labels">
                <span id="exp-progress-label">Progress to Apprentice</span>
                <span id="exp-progress-numbers">0 / 100 EXP</span>
              </div>

              <div
                className="exp-bar"
                role="progressbar"
                aria-label="Experience progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={0}
              >
                <div id="exp-bar-fill"></div>
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

          {/* QUESTION POSTING */}
          <section id="questions" className="questions">
            <h2>Academic Discussions</h2>
            <p>Ask a question and share what you want to learn.</p>

            <form id="question-form">
              <label htmlFor="question-title">Question title</label>
              <input
                type="text"
                id="question-title"
                placeholder="e.g. How do I improve at Mathematics?"
                required
              />

              <label htmlFor="question-subject">Subject</label>
              <select id="question-subject" required>
                <option value="">Choose a subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="Study Advice">Study Advice</option>
                <option value="Other">Other</option>
              </select>

              <label htmlFor="question-details">Details</label>
              <textarea
                id="question-details"
                placeholder="Explain what you need help with..."
                rows={4}
                required
              ></textarea>

              <button type="submit">Post Question</button>
            </form>

            {/* SEARCH AND FILTERS */}
            <div className="discussion-tools">
              <label htmlFor="question-search">Find a discussion</label>
              <input
                id="question-search"
                type="search"
                placeholder="Search questions or keywords..."
                autoComplete="off"
              />

              <label htmlFor="subject-filter">Filter by subject</label>
              <select id="subject-filter">
                <option value="all">All subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="Study Advice">Study Advice</option>
                <option value="Other">Other</option>
              </select>

              <p id="discussion-count" aria-live="polite"></p>
            </div>

            <div id="question-list">
              <h3>Recent Questions</h3>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer>
          <p>Academic Hub © 2026 | Ask. Learn. Improve.</p>
        </footer>
      </div>

            <LegacyScripts />
    </>
  )
}