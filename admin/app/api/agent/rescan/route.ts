import { NextRequest, NextResponse } from 'next/server'
import { runEventAgent } from '@/lib/agents/events'
import { extractRouteFromUrl } from '@/lib/parsers/route-extractor'
import { parseGpx } from '@/lib/parsers/gpx'
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
    let fields: Record<string, unknown> = {}
    let toolCalls: string[] = []
    const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY)

    if (hasApiKey) {
      // Full agent with Claude
      const result = await runEventAgent({
        eventInfoUrl: infoUrl,
        routeSourceUrl: routeUrl,
        gpxContent,
      })
      fields = result.fields
      toolCalls = result.toolCalls

      if (result.route) {
        fields.route_polyline = result.route.polyline
        fields.elevation_profile = result.route.elevation_profile
        if (!fields.distance_km) fields.distance_km = result.route.distance_km
        fields.min_elevation_m = result.route.min_elevation_m
        fields.max_elevation_m = result.route.max_elevation_m
      }
    } else {
      // No API key — try direct route extraction or GPX parse
      if (gpxContent) {
        toolCalls = ['parse_gpx (direct)']
        const route = parseGpx(gpxContent)
        fields.route_polyline = route.polyline
        fields.elevation_profile = route.elevation_profile
        fields.distance_km = route.distance_km
        fields.min_elevation_m = route.min_elevation_m
        fields.max_elevation_m = route.max_elevation_m
      } else if (routeUrl) {
        toolCalls = ['extract_route (direct)']
        const route = await extractRouteFromUrl(routeUrl)
        if (route) {
          fields.route_polyline = route.polyline
          fields.elevation_profile = route.elevation_profile
          fields.distance_km = route.distance_km
          fields.min_elevation_m = route.min_elevation_m
          fields.max_elevation_m = route.max_elevation_m
          fields.route_source_url = routeUrl
        }
      }
      if (Object.keys(fields).length === 0) {
        return NextResponse.json(
          { error: 'ANTHROPIC_API_KEY nicht konfiguriert. Nur direkte Routen-Extraktion (Komoot/RideWithGPS/GPX) verfügbar.' },
          { status: 400 },
        )
      }
    }

    // Compute diff
    const diff: Record<string, { old: unknown; new: unknown }> = {}
    for (const [key, newVal] of Object.entries(fields)) {
      const oldVal = existing[key]
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diff[key] = { old: oldVal, new: newVal }
      }
    }

    return NextResponse.json({
      eventId,
      currentFields: existing,
      newFields: fields,
      diff,
      toolCalls,
    })
  } catch (e) {
    console.error('Rescan error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Rescan failed' },
      { status: 500 },
    )
  }
}
