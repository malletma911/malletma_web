import { getSupabaseAdmin } from './supabase'
import type { StravaActivity } from '@/types'

export async function getAccessToken(email: string): Promise<string | null> {
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

interface StravaGearDetail {
  id: string
  name: string
  brand_name: string
  model_name: string
  frame_type: number // 1=mtb, 2=cross, 3=road, 4=tt
  weight: number // grams, 0 if not set
  description: string
}

export const FRAME_TYPE_MAP: Record<number, string> = {
  1: 'mtb',
  2: 'gravel',
  3: 'road',
  4: 'tt',
  5: 'road', // track → road
}

export async function fetchGearDetail(accessToken: string, gearId: string): Promise<StravaGearDetail | null> {
  const res = await fetch(`https://www.strava.com/api/v3/gear/${gearId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return res.json()
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
  activitiesStored?: number
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

    // Fetch gear details from Strava and update bike info
    const gearDetail = await fetchGearDetail(accessToken, gearId)
    if (gearDetail) {
      const bikeUpdate: Record<string, unknown> = {}
      if (gearDetail.brand_name) bikeUpdate.brand = gearDetail.brand_name
      if (gearDetail.model_name) bikeUpdate.model = gearDetail.model_name
      if (gearDetail.weight > 0) {
        bikeUpdate.weight_kg = gearDetail.weight < 100
          ? Math.round(gearDetail.weight * 10) / 10
          : Math.round(gearDetail.weight / 100) / 10
      }
      if (gearDetail.frame_type && FRAME_TYPE_MAP[gearDetail.frame_type]) {
        bikeUpdate.type = FRAME_TYPE_MAP[gearDetail.frame_type]
      }
      if (Object.keys(bikeUpdate).length > 0) {
        await supabase.from('bikes').update(bikeUpdate).eq('id', bike.id)
      }
    }

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
    let lastActivityName: string | null = null
    let firstActivityDate: string | null = null
    let totalWatts = 0
    let wattsCount = 0
    let maxWatts = 0
    let totalHr = 0
    let hrCount = 0
    let maxHr = 0
    let totalSufferScore = 0
    let totalPrCount = 0
    let totalKudos = 0
    let trainerCount = 0
    let totalKilojoules = 0

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
        lastActivityName = a.name
      }
      if (!firstActivityDate || a.start_date < firstActivityDate) {
        firstActivityDate = a.start_date
      }

      if (a.average_watts && a.average_watts > 0) {
        totalWatts += a.average_watts
        wattsCount++
      }
      if (a.max_watts && a.max_watts > maxWatts) maxWatts = a.max_watts

      if (a.average_heartrate && a.average_heartrate > 0) {
        totalHr += a.average_heartrate
        hrCount++
      }
      if (a.max_heartrate && a.max_heartrate > maxHr) maxHr = a.max_heartrate

      if (a.suffer_score) totalSufferScore += a.suffer_score
      if (a.pr_count) totalPrCount += a.pr_count
      if (a.kudos_count) totalKudos += a.kudos_count
      if (a.trainer) trainerCount++
      if (a.kilojoules) totalKilojoules += a.kilojoules
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
        last_activity_name: lastActivityName,
        first_activity_date: firstActivityDate,
        avg_watts: wattsCount > 0 ? Math.round(totalWatts / wattsCount) : null,
        max_watts: maxWatts > 0 ? maxWatts : null,
        avg_heartrate: hrCount > 0 ? Math.round(totalHr / hrCount) : null,
        max_heartrate: maxHr > 0 ? maxHr : null,
        total_suffer_score: totalSufferScore > 0 ? totalSufferScore : null,
        total_pr_count: totalPrCount > 0 ? totalPrCount : null,
        total_kudos: totalKudos > 0 ? totalKudos : null,
        trainer_activities: trainerCount > 0 ? trainerCount : null,
        avg_distance_km: activities.length > 0 ? Math.round(totalDistanceKm / activities.length * 10) / 10 : null,
        avg_elevation_per_ride: activities.length > 0 ? Math.round(totalElevationM / activities.length) : null,
        total_kilojoules: totalKilojoules > 0 ? Math.round(totalKilojoules) : null,
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

// Sync all activities to DB + compute athlete-level aggregations
export async function syncAllStats(email: string): Promise<{ activitiesStored: number; errors: string[] }> {
  const supabase = getSupabaseAdmin()
  const result = { activitiesStored: 0, errors: [] as string[] }

  const accessToken = await getAccessToken(email)
  if (!accessToken) {
    result.errors.push('Could not get Strava access token')
    return result
  }

  const allActivities = await fetchAllActivities(accessToken)

  // Store individual activities (batch upsert in chunks of 50)
  const CHUNK = 50
  for (let i = 0; i < allActivities.length; i += CHUNK) {
    const chunk = allActivities.slice(i, i + CHUNK).map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      start_date: a.start_date,
      distance_km: Math.round(a.distance / 1000 * 100) / 100,
      elevation_m: Math.round(a.total_elevation_gain),
      moving_time_s: a.moving_time,
      avg_speed_kmh: a.average_speed ? Math.round(a.average_speed * 3.6 * 10) / 10 : null,
      max_speed_kmh: a.max_speed ? Math.round(a.max_speed * 3.6 * 10) / 10 : null,
      avg_watts: a.average_watts ?? null,
      max_watts: a.max_watts ?? null,
      avg_heartrate: a.average_heartrate ?? null,
      max_heartrate: a.max_heartrate ?? null,
      avg_cadence: a.average_cadence ?? null,
      kilojoules: a.kilojoules ?? null,
      suffer_score: a.suffer_score ?? null,
      pr_count: a.pr_count ?? 0,
      kudos_count: a.kudos_count ?? 0,
      trainer: a.trainer ?? false,
      gear_id: a.gear_id ?? null,
      summary_polyline: a.map?.summary_polyline ?? null,
      synced_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('strava_activities').upsert(chunk, { onConflict: 'id' })
    if (error) {
      result.errors.push(`Activity batch ${i}: ${error.message}`)
    } else {
      result.activitiesStored += chunk.length
    }
  }

  // Aggregate athlete-level stats
  let totalDistKm = 0, totalElevM = 0, totalTimeS = 0, totalKj = 0
  let maxSpeed = 0, maxW = 0, maxHr = 0, maxElevM = 0
  let longestKm = 0, longestName = '', biggestClimb = 0, biggestClimbName = ''
  let totalWatts = 0, wattsN = 0, totalHrSum = 0, hrN = 0
  let totalKudos = 0, totalPrs = 0, totalSuffer = 0
  let outdoorN = 0, indoorN = 0
  let firstDate: string | null = null, lastDate: string | null = null

  for (const a of allActivities) {
    const dkm = a.distance / 1000
    totalDistKm += dkm
    totalElevM += a.total_elevation_gain
    totalTimeS += a.moving_time
    if (a.kilojoules) totalKj += a.kilojoules

    const spd = a.max_speed * 3.6
    if (spd > maxSpeed) maxSpeed = spd
    if (a.max_watts && a.max_watts > maxW) maxW = a.max_watts
    if (a.max_heartrate && a.max_heartrate > maxHr) maxHr = a.max_heartrate
    if (a.total_elevation_gain > maxElevM) maxElevM = a.total_elevation_gain

    if (dkm > longestKm) { longestKm = dkm; longestName = a.name }
    if (a.total_elevation_gain > biggestClimb) { biggestClimb = a.total_elevation_gain; biggestClimbName = a.name }

    if (a.average_watts && a.average_watts > 0) { totalWatts += a.average_watts; wattsN++ }
    if (a.average_heartrate && a.average_heartrate > 0) { totalHrSum += a.average_heartrate; hrN++ }

    if (a.kudos_count) totalKudos += a.kudos_count
    if (a.pr_count) totalPrs += a.pr_count
    if (a.suffer_score) totalSuffer += a.suffer_score
    if (a.trainer) indoorN++; else outdoorN++

    if (!firstDate || a.start_date < firstDate) firstDate = a.start_date
    if (!lastDate || a.start_date > lastDate) lastDate = a.start_date
  }

  // Streak calculation
  const activityDates = new Set(allActivities.map(a => a.start_date.split('T')[0]))
  const sortedDays = [...activityDates].sort()
  let currentStreak = 0, longestStreak = 0, streak = 0

  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { streak = 1 }
    else {
      const prev = new Date(sortedDays[i - 1])
      const curr = new Date(sortedDays[i])
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      streak = diff === 1 ? streak + 1 : 1
    }
    if (streak > longestStreak) longestStreak = streak
  }

  // Current streak: count backwards from today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let d = new Date(today); ; d.setDate(d.getDate() - 1)) {
    const ds = d.toISOString().split('T')[0]
    if (activityDates.has(ds)) currentStreak++
    else break
  }

  const n = allActivities.length
  const { error: statsError } = await supabase.from('athlete_stats').upsert({
    id: '00000000-0000-0000-0000-000000000001',
    total_distance_km: Math.round(totalDistKm * 100) / 100,
    total_elevation_m: Math.round(totalElevM),
    total_moving_time_s: totalTimeS,
    total_activities: n,
    total_kilojoules: totalKj > 0 ? Math.round(totalKj) : null,
    max_speed_kmh: maxSpeed > 0 ? Math.round(maxSpeed * 10) / 10 : null,
    max_watts: maxW > 0 ? maxW : null,
    max_heartrate: maxHr > 0 ? maxHr : null,
    longest_ride_km: longestKm > 0 ? Math.round(longestKm * 100) / 100 : null,
    longest_ride_name: longestName || null,
    biggest_climb_m: biggestClimb > 0 ? Math.round(biggestClimb) : null,
    biggest_climb_name: biggestClimbName || null,
    max_elevation_m: maxElevM > 0 ? Math.round(maxElevM) : null,
    avg_speed_kmh: totalTimeS > 0 ? Math.round(totalDistKm / (totalTimeS / 3600) * 10) / 10 : null,
    avg_watts: wattsN > 0 ? Math.round(totalWatts / wattsN) : null,
    avg_heartrate: hrN > 0 ? Math.round(totalHrSum / hrN) : null,
    avg_distance_km: n > 0 ? Math.round(totalDistKm / n * 10) / 10 : null,
    avg_elevation_per_ride: n > 0 ? Math.round(totalElevM / n) : null,
    total_kudos: totalKudos,
    total_pr_count: totalPrs,
    total_suffer_score: totalSuffer,
    outdoor_activities: outdoorN,
    indoor_activities: indoorN,
    current_streak_days: currentStreak,
    longest_streak_days: longestStreak,
    first_activity_date: firstDate,
    last_activity_date: lastDate,
    synced_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (statsError) result.errors.push(`athlete_stats: ${statsError.message}`)

  return result
}
