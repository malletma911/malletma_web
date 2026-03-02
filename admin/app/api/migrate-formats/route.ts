import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

/**
 * One-time migration: convert old-format route_polyline and elevation_profile
 * to the new format expected by the frontend.
 *
 * Old: route_polyline = [{lat, lng}, ...], elevation_profile = [{distance_km, elevation_m}, ...]
 * New: route_polyline = [[lat, lng], ...], elevation_profile = [{d, e}, ...]
 *
 * Call via POST /api/migrate-formats — safe to run multiple times (idempotent).
 * Delete this file after migration is confirmed.
 */
export async function POST() {
  const supabase = getSupabase()
  const { data: events, error } = await supabase
    .from('events')
    .select('id, name, route_polyline, elevation_profile')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: { id: string; name: string; fixed: string[] }[] = []

  for (const event of events ?? []) {
    const fixes: string[] = []
    const updates: Record<string, unknown> = {}

    // Check route_polyline
    if (Array.isArray(event.route_polyline) && event.route_polyline.length > 0) {
      const first = event.route_polyline[0]
      if (typeof first === 'object' && first !== null && !Array.isArray(first) && 'lat' in first) {
        updates.route_polyline = event.route_polyline.map(
          (p: { lat: number; lng: number }) => [p.lat, p.lng]
        )
        fixes.push(`route_polyline: ${event.route_polyline.length} points converted`)
      }
    }

    // Check elevation_profile
    if (Array.isArray(event.elevation_profile) && event.elevation_profile.length > 0) {
      const first = event.elevation_profile[0]
      if (typeof first === 'object' && first !== null && 'distance_km' in first) {
        updates.elevation_profile = event.elevation_profile.map(
          (p: { distance_km: number; elevation_m: number }) => ({
            d: Math.round(p.distance_km * 10) / 10,
            e: Math.round(p.elevation_m),
          })
        )
        fixes.push(`elevation_profile: ${event.elevation_profile.length} points converted`)
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('events')
        .update(updates)
        .eq('id', event.id)

      if (updateError) {
        fixes.push(`ERROR: ${updateError.message}`)
      }
      results.push({ id: event.id, name: event.name, fixed: fixes })
    }
  }

  return NextResponse.json({
    total: events?.length ?? 0,
    migrated: results.length,
    results,
  })
}
