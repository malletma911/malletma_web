import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { eventId, fieldsToApply } = body as {
    eventId: string
    fieldsToApply: Record<string, unknown>
  }

  if (!eventId || !fieldsToApply || Object.keys(fieldsToApply).length === 0) {
    return NextResponse.json({ error: 'eventId and fieldsToApply are required' }, { status: 400 })
  }

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('events')
    .update({ ...fieldsToApply, last_scanned_at: new Date().toISOString() })
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Log the applied rescan
  await supabase.from('agent_scan_log').insert({
    event_id: eventId,
    scan_type: 'rescan',
    result: fieldsToApply,
    diff_summary: `Updated ${Object.keys(fieldsToApply).length} fields: ${Object.keys(fieldsToApply).join(', ')}`,
    applied: true,
  })

  return NextResponse.json(data)
}
