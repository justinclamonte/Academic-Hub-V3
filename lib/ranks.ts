export const RANKS = [
  { level: 1, title: 'Novice Scholar', exp: 0, avatar: '📚' },
  { level: 2, title: 'Apprentice', exp: 100, avatar: '📘' },
  { level: 3, title: 'Knowledge Seeker', exp: 250, avatar: '🔎' },
  { level: 4, title: 'Adept Scholar', exp: 450, avatar: '🪶' },
  { level: 5, title: 'Expert', exp: 700, avatar: '📖' },
  { level: 6, title: 'Master Scholar', exp: 1000, avatar: '🔮' },
  { level: 7, title: 'Grand Scholar', exp: 1400, avatar: '🏅' },
  { level: 8, title: 'Sage', exp: 1900, avatar: '🌟' },
  { level: 9, title: 'Grand Sage', exp: 2500, avatar: '💎' },
  { level: 10, title: 'Legendary Scholar', exp: 3200, avatar: '👑' },
]

export function getRank(exp: number) {
  let current = RANKS[0]
  let next: (typeof RANKS)[number] | null = null
  for (let i = 0; i < RANKS.length; i++) {
    if (exp >= RANKS[i].exp) current = RANKS[i]
    else {
      next = RANKS[i]
      break
    }
  }
  return { current, next }
}