import { NextRequest, NextResponse } from 'next/server'
import { runEventAgent } from '@/lib/agents/events'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { eventId, eventInfoUrl, routeSourceUrl, gpxContent } = body as {
    eventId: string
    eventInfoUrl?: string
    routeSourceUrl?: string
    gpxContent?: string
  }

  if (!eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Use stored URLs as fallback
  const infoUrl = eventInfoUrl || existing.event_info_url
  const routeUrl = routeSourceUrl || existing.route_source_url

  try {
    const result = await runEventAgent({
      eventInfoUrl: infoUrl,
      routeSourceUrl: routeUrl,
      gpxContent,
    })

    // Merge route data
    if (result.route) {
      result.fields.route_polyline = result.route.polyline
      result.fields.elevation_profile = result.route.elevation_profile
      if (!result.fields.distance_km) result.fields.distance_km = result.route.distance_km
      result.fields.min_elevation_m = result.route.min_elevation_m
      result.fields.max_elevation_m = result.route.max_elevation_m
    }

    // Compute diff
    const diff: Record<string, { old: unknown; new: unknown }> = {}
    for (const [key, newVal] of Object.entries(result.fields)) {
      const oldVal = existing[key]
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diff[key] = { old: oldVal, new: newVal }
      }
    }

    return NextResponse.json({
      eventId,
      currentFields: existing,
      newFields: result.fields,
      diff,
      toolCalls: result.toolCalls,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Rescan failed' },
      { status: 500 },
    )
  }
}
