import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ShopPage from '@/components/ShopPage'

export const metadata: Metadata = {
  title: 'Avatar Shop | Academic Hub',
}

export default function Shop() {
  return (
    <div id="dashboard-section">
      <SiteHeader />
      <ShopPage />
      <SiteFooter />
    </div>
  )
}