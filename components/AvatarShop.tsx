'use client'

import { useState } from 'react'
import { SignInButton } from '@clerk/nextjs'
import { AVATARS } from '@/lib/avatars'
import { buyAvatar, equipAvatar } from '@/app/shop'
import type { ActionResult, ShopState } from '@/lib/types'

export default function AvatarShop(props: {
  shop: ShopState
  signedIn: boolean
  onChanged: () => void
}) {
  const { shop, signedIn, onChanged } = props
  const [busy, setBusy] = useState<string | null>(null)

  async function run(id: string, task: () => Promise<ActionResult>) {
    setBusy(id)
    const result = await task()
    setBusy(null)
    if (result.message) alert(result.message)
    onChanged()
  }

  return (
    <section id="shop" className="shop">
      <h2>🛒 Avatar Shop</h2>
      <p>Earn coins by posting questions and replying (1 coin for every EXP you earn), then spend them on avatars for your profile.</p>

      {signedIn ? (
        <p>
          🪙 You have <strong>{shop.coins}</strong> coins{' '}
          {shop.equipped && (
            <button type="button" onClick={() => run('rank', () => equipAvatar(null))}>
              Use my rank avatar
            </button>
          )}
        </p>
      ) : (
        <p>
          Sign in to earn coins and buy avatars.{' '}
          <SignInButton mode="modal">
            <button type="button">Sign in</button>
          </SignInButton>
        </p>
      )}

      <div
        className="shop-grid"
        style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
      >
        {AVATARS.map((avatar) => {
          const owned = shop.owned.includes(avatar.id)
          const equipped = shop.equipped === avatar.id
          return (
            <article
              key={avatar.id}
              className="shop-card"
              style={{ border: '1px solid #8884', borderRadius: 8, padding: 12, textAlign: 'center' }}
            >
              <div style={{ fontSize: 48 }}>{avatar.emoji}</div>
              <h3>{avatar.name}</h3>
              <p>🪙 {avatar.price}</p>
              {equipped ? (
                <button type="button" disabled>✅ Equipped</button>
              ) : owned ? (
                <button
                  type="button"
                  disabled={busy === avatar.id}
                  onClick={() => run(avatar.id, () => equipAvatar(avatar.id))}
                >
                  Equip
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!signedIn || busy === avatar.id}
                  onClick={() => run(avatar.id, () => buyAvatar(avatar.id))}
                >
                  Buy
                </button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}