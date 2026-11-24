import Link from 'next/link'

export default function SiteHeader() {
  return (
    <header className="navbar">
      <h1>📚 Academic Hub</h1>
      <nav>
        <Link href="/#home">Home</Link>
        <Link href="/#subjects">Subjects</Link>
        <Link href="/#questions">Questions</Link>
        <Link href="/shop">🛒 Shop</Link>
        <Link href="/dashboard">👤 Dashboard</Link>
      </nav>
    </header>
  )
}