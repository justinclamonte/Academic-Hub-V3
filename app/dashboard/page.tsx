import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import DashboardPage from '@/components/DashboardPage'

export const metadata: Metadata = {
  title: 'My Dashboard | Academic Hub',
}

export default function Dashboard() {
  return (
    <div id="dashboard-section">
      <SiteHeader />
      <DashboardPage />
      <SiteFooter />
    </div>
  )
}