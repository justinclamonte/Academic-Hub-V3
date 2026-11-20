import AcademicHub from '@/components/AcademicHub'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function Home() {
  return (
    <div id="dashboard-section">
      <SiteHeader />
      <AcademicHub />
      <SiteFooter />
    </div>
  )
}