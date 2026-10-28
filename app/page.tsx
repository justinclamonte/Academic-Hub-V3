import AcademicHub from '@/components/AcademicHub'

export default function Home() {
  return (
    <div id="dashboard-section">
      <header className="navbar">
        <h1>📚 Academic Hub</h1>
        <nav>
          <a href="#home">Home</a>
          <a href="#subjects">Subjects</a>
          <a href="#questions">Questions</a>
        </nav>
      </header>

      <AcademicHub />

      <footer>
        <p>Academic Hub © 2026 | Ask. Learn. Improve.</p>
      </footer>
    </div>
  )
}
