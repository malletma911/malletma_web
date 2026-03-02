import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

const NUMERIC_FIELDS = ['distance_km', 'elevation_m', 'participants', 'min_elevation_m', 'max_elevation_m']

function cleanBody(body: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    // Skip empty strings — let DB use defaults/null
    if (value === '' || value === undefined) continue
    // Convert numeric fields
    if (NUMERIC_FIELDS.includes(key) && typeof value === 'string') {
      const n = Number(value)
      if (!isNaN(n)) cleaned[key] = n
      continue
    }
    cleaned[key] = value
  }
  return cleaned
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const cleaned = cleanBody(body)
  const supabase = getSupabase()

  console.log('POST /api/events — inserting:', JSON.stringify(cleaned))

  const { data, error } = await supabase
    .from('events')
    .insert(cleaned)
    .select()
    .single()

  if (error) {
    console.error('POST /api/events — error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data, { status: 201 })
}
