import { getSupabase } from './supabase'

const PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
  '#F1948A', '#AED6F1', '#D7BDE2', '#A3E4D7',
]

export async function assignColor(): Promise<string> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('events')
    .select('color')
    .not('color', 'is', null)

  const used = new Set((data ?? []).map(r => r.color))

  for (const c of PALETTE) {
    if (!used.has(c)) return c
  }
  // All used — return random from palette
  return PALETTE[Math.floor(Math.random() * PALETTE.length)]
}
