import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

const NUMERIC_FIELDS = ['distance_km', 'elevation_m', 'participants', 'min_elevation_m', 'max_elevation_m']

function cleanBody(body: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (value === '' || value === undefined) continue
    if (NUMERIC_FIELDS.includes(key) && typeof value === 'string') {
      const n = Number(value)
      if (!isNaN(n)) cleaned[key] = n
      continue
    }
    cleaned[key] = value
  }
  return cleaned
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()
  const cleaned = cleanBody(body)
  const supabase = getSupabase()

  console.log('PUT /api/events/' + id, JSON.stringify(cleaned))

  const { data, error } = await supabase
    .from('events')
    .update(cleaned)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('PUT /api/events/' + id + ' — error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = getSupabase()
  const { error } = await supabase.from('events').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
