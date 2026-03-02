import { NextRequest, NextResponse } from 'next/server'
import { runEventAgent } from '@/lib/agents/events'
import { assignColor } from '@/lib/colors'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { eventInfoUrl, routeSourceUrl, gpxContent, saveToDb } = body as {
    eventInfoUrl?: string
    routeSourceUrl?: string
    gpxContent?: string
    saveToDb?: boolean
  }

  if (!eventInfoUrl && !routeSourceUrl && !gpxContent) {
    return NextResponse.json(
      { error: 'Provide at least one of: eventInfoUrl, routeSourceUrl, gpxContent' },
      { status: 400 },
    )
  }

  try {
    const result = await runEventAgent({ eventInfoUrl, routeSourceUrl, gpxContent })

    // Auto-assign color if not set
    if (!result.fields.color) {
      result.fields.color = await assignColor()
    }

    // Merge route data into fields
    if (result.route) {
      result.fields.route_polyline = result.route.polyline
      result.fields.elevation_profile = result.route.elevation_profile
      if (!result.fields.distance_km) result.fields.distance_km = result.route.distance_km
      result.fields.min_elevation_m = result.route.min_elevation_m
      result.fields.max_elevation_m = result.route.max_elevation_m
    }

    // Store source URLs
    if (eventInfoUrl) result.fields.event_info_url = eventInfoUrl
    if (routeSourceUrl) result.fields.route_source_url = routeSourceUrl

    // Optionally save directly to DB
    if (saveToDb) {
      const supabase = getSupabase()
      result.fields.last_scanned_at = new Date().toISOString()
      result.fields.status = 'draft'

      const { data, error } = await supabase
        .from('events')
        .insert(result.fields)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message, fields: result.fields }, { status: 400 })
      }

      // Log scan
      await supabase.from('agent_scan_log').insert({
        event_id: data.id,
        scan_type: 'initial',
        input_urls: { eventInfoUrl, routeSourceUrl, hasGpx: !!gpxContent },
        result: result.fields,
      })

      return NextResponse.json({ event: data, toolCalls: result.toolCalls })
    }

    return NextResponse.json({ fields: result.fields, toolCalls: result.toolCalls })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Agent failed' },
      { status: 500 },
    )
  }
}
