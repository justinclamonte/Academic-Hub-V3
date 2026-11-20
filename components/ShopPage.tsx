'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { getShop } from '@/app/shop'
import AvatarShop from '@/components/AvatarShop'
import type { ShopState } from '@/lib/types'

export default function ShopPage() {
  const { isSignedIn } = useUser()
  const [shop, setShop] = useState<ShopState>({ coins: 0, owned: [], equipped: null })

  const refresh = useCallback(async () => {
    try {
      setShop(await getShop())
    } catch (error) {
      console.error('Could not load the shop:', error)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, isSignedIn])

  return (
    <main>
      <p>
        <Link href="/#player-profile">← Back to my profile</Link>
      </p>
      <AvatarShop shop={shop} signedIn={!!isSignedIn} onChanged={refresh} />
    </main>
  )
}