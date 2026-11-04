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

            <footer className="site-footer">
        <p>Academic Hub © 2026 | Ask. Learn. Improve.</p>

        <div className="footer-credits">
          <h4>Credits</h4>
          <ul>
            <li>Created by <strong>Ian Asna, AcademicTeam.ph</strong></li>
            <li>Designed by <strong>Ian Asna</strong></li>
            <li>Beta Testing and huge thanks to <strong>Clyde Gellica, Hadraniel Vanwayne Tejero, Spac3-ServerCom&OAuth</strong></li>
          </ul>
        </div>

        <p>
          Questions or concerns?{' '}
          <a href="mailto:xspacexchina@gmail.com?subject=Academic%20Hub%20Inquiry">
            ✉️ Email us
          </a>
        </p>
      </footer>
    </div>
  )
}
