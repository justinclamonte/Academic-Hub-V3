'use server'

import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { AVATARS } from '@/lib/avatars'
import type { ActionResult, ShopState } from '@/lib/types'

export async function getShop(): Promise<ShopState> {
  const { userId } = await auth()
  if (!userId) return { coins: 0, owned: [], equipped: null }

  const [profile, owned] = await Promise.all([
    supabase.from('hub_profiles').select('coins, avatar_id').eq('user_id', userId).maybeSingle(),
    supabase.from('hub_avatars_owned').select('avatar_id').eq('user_id', userId),
  ])

  return {
    coins: profile.data?.coins ?? 0,
    owned: (owned.data ?? []).map((row) => row.avatar_id as string),
    equipped: profile.data?.avatar_id ?? null,
  }
}

export async function buyAvatar(avatarId: string): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, message: 'Please sign in to shop.' }

  const avatar = AVATARS.find((a) => a.id === avatarId)
  if (!avatar) return { ok: false, message: 'That avatar does not exist.' }

  const { data, error } = await supabase.rpc('buy_avatar', {
    p_user: userId,
    p_avatar: avatar.id,
    p_price: avatar.price,
  })
  if (error) {
    console.error('buyAvatar error:', error)
    return { ok: false, message: 'The purchase could not be completed. Please try again.' }
  }

  if (data === 'owned') return { ok: false, message: 'You already own this avatar.' }
  if (data === 'insufficient') {
    return { ok: false, message: 'Not enough coins yet. Keep posting and replying to earn more!' }
  }
  return { ok: true, message: 'You bought ' + avatar.name + '! Tap Equip to use it.' }
}

export async function equipAvatar(avatarId: string | null): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, message: 'Please sign in first.' }

  if (avatarId) {
    const { data } = await supabase
      .from('hub_avatars_owned')
      .select('avatar_id')
      .eq('user_id', userId)
      .eq('avatar_id', avatarId)
      .maybeSingle()
    if (!data) return { ok: false, message: 'You do not own this avatar.' }
  }

  const { error } = await supabase
    .from('hub_profiles')
    .upsert({ user_id: userId, avatar_id: avatarId })
  if (error) {
    console.error('equipAvatar error:', error)
    return { ok: false, message: 'Could not change your avatar.' }
  }
  return { ok: true }
}