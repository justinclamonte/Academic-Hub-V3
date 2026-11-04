import { supabase } from '@/lib/supabase'

export async function getBlockMessage(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('hub_sanctions')
    .select('kind, until, reason')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null
  const why = data.reason ? ' Reason: ' + data.reason : ''

  if (data.kind === 'banned') {
    return 'Your account has been banned from posting.' + why
  }
  if (data.until && new Date(data.until) > new Date()) {
    return 'Your account is suspended until ' + new Date(data.until).toLocaleString() + '.' + why
  }
  return null
}