import { NextRequest, NextResponse } from 'next/server'
import { runEventAgent } from '@/lib/agents/events'
import { extractRouteFromUrl } from '@/lib/parsers/route-extractor'
import { parseGpx } from '@/lib/parsers/gpx'
import { computeDifficulty } from '@/lib/difficulty'
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
    const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY)
    let fields: Record<string, unknown> = {}
    let toolCalls: string[] = []

    if (hasApiKey) {
      // Full agent with Claude
      const result = await runEventAgent({ eventInfoUrl, routeSourceUrl, gpxContent })
      fields = result.fields
      toolCalls = result.toolCalls

      if (result.route) {
        fields.route_polyline = result.route.polyline
        fields.elevation_profile = result.route.elevation_profile
        if (!fields.distance_km) fields.distance_km = result.route.distance_km
        if (!fields.elevation_m) fields.elevation_m = result.route.elevation_m
        fields.min_elevation_m = result.route.min_elevation_m
        fields.max_elevation_m = result.route.max_elevation_m
      }
    } else {
      // No API key — direct extraction only
      if (gpxContent) {
        toolCalls = ['parse_gpx (direct)']
        const route = parseGpx(gpxContent)
        fields.route_polyline = route.polyline
        fields.elevation_profile = route.elevation_profile
        fields.distance_km = route.distance_km
        fields.elevation_m = route.elevation_m
        fields.min_elevation_m = route.min_elevation_m
        fields.max_elevation_m = route.max_elevation_m
      } else if (routeSourceUrl) {
        toolCalls = ['extract_route (direct)']
        const route = await extractRouteFromUrl(routeSourceUrl)
        if (route) {
          fields.route_polyline = route.polyline
          fields.elevation_profile = route.elevation_profile
          fields.distance_km = route.distance_km
          fields.elevation_m = route.elevation_m
          fields.min_elevation_m = route.min_elevation_m
          fields.max_elevation_m = route.max_elevation_m
        }
      }
      if (Object.keys(fields).length === 0 && !gpxContent) {
        return NextResponse.json(
          { error: 'ANTHROPIC_API_KEY nicht konfiguriert. Nur direkte Routen-Extraktion (Komoot/RideWithGPS/GPX) verfügbar.' },
          { status: 400 },
        )
      }
    }

    // Auto-assign color if not set
    if (!fields.color) {
      fields.color = await assignColor()
    }

    // Auto-compute difficulty if not set
    if (!fields.difficulty && fields.distance_km && fields.elevation_m) {
      fields.difficulty = computeDifficulty(Number(fields.distance_km), Number(fields.elevation_m))
    }

    // Store source URLs
    if (eventInfoUrl) fields.event_info_url = eventInfoUrl
    if (routeSourceUrl) fields.route_source_url = routeSourceUrl

    // Optionally save directly to DB
    if (saveToDb) {
      const supabase = getSupabase()
      fields.last_scanned_at = new Date().toISOString()
      fields.status = 'draft'

      const { data, error } = await supabase
        .from('events')
        .insert(fields)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message, fields }, { status: 400 })
      }

      await supabase.from('agent_scan_log').insert({
        event_id: data.id,
        scan_type: 'initial',
        input_urls: { eventInfoUrl, routeSourceUrl, hasGpx: Boolean(gpxContent) },
        result: fields,
      })

      return NextResponse.json({ event: data, toolCalls })
    }

    return NextResponse.json({ fields, toolCalls })
  } catch (e) {
    console.error('Agent error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Agent failed' },
      { status: 500 },
    )
  }
}
