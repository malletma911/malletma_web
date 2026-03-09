import { getSupabaseAdmin } from './supabase'
import type { StravaActivity } from '@/types'

async function getAccessToken(email: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const { data: tokenRow } = await supabase
    .from('oauth_tokens')
    .select('access_token, expires_at, refresh_token')
    .eq('user_email', email)
    .eq('provider', 'strava')
    .single()

  if (!tokenRow) return null

  if (new Date(tokenRow.expires_at) >= new Date()) {
    return tokenRow.access_token
  }

  // Token expired — refresh
  const refreshRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: Number(process.env.STRAVA_CLIENT_ID),
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: tokenRow.refresh_token,
    }),
  })

  if (!refreshRes.ok) return null
  const refreshed = await refreshRes.json()

  await supabase.from('oauth_tokens').upsert({
    user_email: email,
    provider: 'strava',
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
  }, { onConflict: 'user_email,provider' })

  return refreshed.access_token
}

interface StravaGear {
  id: string
  name: string
  distance: number
}

export async function getStravaGearList(email: string): Promise<StravaGear[]> {
  const accessToken = await getAccessToken(email)
  if (!accessToken) return []

  const res = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []

  const athlete = await res.json()
  return (athlete.bikes ?? []) as StravaGear[]
}

async function fetchAllActivities(accessToken: string): Promise<StravaActivity[]> {
  const all: StravaActivity[] = []
  let page = 1
  const perPage = 200

  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) break

    const activities: StravaActivity[] = await res.json()
    if (activities.length === 0) break

    all.push(...activities)
    if (activities.length < perPage) break
    page++

    // Rate limit safety: max 10 pages (2000 activities)
    if (page > 10) break
  }

  return all
}

export interface SyncResult {
  synced: number
  errors: string[]
}

export async function syncBikeStats(email: string): Promise<SyncResult> {
  const supabase = getSupabaseAdmin()
  const result: SyncResult = { synced: 0, errors: [] }

  // Get bikes with Strava gear IDs
  const { data: bikes } = await supabase
    .from('bikes')
    .select('id, strava_gear_id')
    .not('strava_gear_id', 'is', null)

  if (!bikes || bikes.length === 0) {
    return result
  }

  const accessToken = await getAccessToken(email)
  if (!accessToken) {
    result.errors.push('Could not get Strava access token')
    return result
  }

  // Fetch all activities
  const allActivities = await fetchAllActivities(accessToken)

  // Group activities by gear_id
  const byGear = new Map<string, StravaActivity[]>()
  for (const activity of allActivities) {
    if (!activity.gear_id) continue
    const existing = byGear.get(activity.gear_id) ?? []
    existing.push(activity)
    byGear.set(activity.gear_id, existing)
  }

  // Aggregate stats per bike
  for (const bike of bikes) {
    const gearId = bike.strava_gear_id
    if (!gearId) continue

    const activities = byGear.get(gearId) ?? []

    let totalDistanceKm = 0
    let totalElevationM = 0
    let totalMovingTimeS = 0
    let maxSpeedKmh = 0
    let longestRideKm = 0
    let longestRideName = ''
    let biggestClimbM = 0
    let biggestClimbName = ''
    let lastActivityDate: string | null = null

    for (const a of activities) {
      const distKm = a.distance / 1000
      totalDistanceKm += distKm
      totalElevationM += a.total_elevation_gain
      totalMovingTimeS += a.moving_time

      const speedKmh = a.max_speed * 3.6
      if (speedKmh > maxSpeedKmh) maxSpeedKmh = speedKmh

      if (distKm > longestRideKm) {
        longestRideKm = distKm
        longestRideName = a.name
      }

      if (a.total_elevation_gain > biggestClimbM) {
        biggestClimbM = a.total_elevation_gain
        biggestClimbName = a.name
      }

      if (!lastActivityDate || a.start_date > lastActivityDate) {
        lastActivityDate = a.start_date
      }
    }

    const avgSpeedKmh = totalMovingTimeS > 0
      ? (totalDistanceKm / (totalMovingTimeS / 3600))
      : null

    const { error } = await supabase
      .from('bike_strava_stats')
      .upsert({
        bike_id: bike.id,
        total_distance_km: Math.round(totalDistanceKm * 100) / 100,
        total_elevation_m: Math.round(totalElevationM),
        total_moving_time_s: totalMovingTimeS,
        total_activities: activities.length,
        max_speed_kmh: maxSpeedKmh > 0 ? Math.round(maxSpeedKmh * 10) / 10 : null,
        longest_ride_km: longestRideKm > 0 ? Math.round(longestRideKm * 100) / 100 : null,
        longest_ride_name: longestRideName || null,
        biggest_climb_m: biggestClimbM > 0 ? Math.round(biggestClimbM) : null,
        biggest_climb_name: biggestClimbName || null,
        avg_speed_kmh: avgSpeedKmh ? Math.round(avgSpeedKmh * 10) / 10 : null,
        last_activity_date: lastActivityDate,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'bike_id' })

    if (error) {
      result.errors.push(`Bike ${bike.id}: ${error.message}`)
    } else {
      result.synced++
    }
  }

  return result
}
