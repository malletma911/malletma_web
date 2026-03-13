export interface StravaActivity {
  id: number
  name: string
  type: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  start_date: string
  average_speed: number
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  average_watts?: number
  max_watts?: number
  kilojoules?: number
  average_cadence?: number
  suffer_score?: number
  pr_count?: number
  kudos_count?: number
  trainer?: boolean
  gear_id?: string
  map?: { summary_polyline: string | null }
}

export interface Bike {
  id: string
  name: string
  brand: string | null
  model: string | null
  type: 'road' | 'gravel' | 'mtb' | 'tt' | string
  photo_url: string | null
  description: string | null
  weight_kg: number | null
  year: number | null
  frame_material: string | null
  groupset: string | null
  wheels: string | null
  strava_gear_id: string | null
  display_order: number
  status: string
  color: string | null
  photo_scale: number | null
  strava_display: Record<string, boolean> | null
}

export interface BikeStravaStats {
  bike_id: string
  total_distance_km: number
  total_elevation_m: number
  total_moving_time_s: number
  total_activities: number
  max_speed_kmh: number | null
  longest_ride_km: number | null
  longest_ride_name: string | null
  biggest_climb_m: number | null
  biggest_climb_name: string | null
  avg_speed_kmh: number | null
  last_activity_date: string | null
  last_activity_name: string | null
  first_activity_date: string | null
  avg_watts: number | null
  max_watts: number | null
  avg_heartrate: number | null
  max_heartrate: number | null
  total_suffer_score: number | null
  total_pr_count: number | null
  total_kudos: number | null
  trainer_activities: number | null
  avg_distance_km: number | null
  avg_elevation_per_ride: number | null
  total_kilojoules: number | null
  synced_at: string
}

export interface AthleteStats {
  total_distance_km: number
  total_elevation_m: number
  total_moving_time_s: number
  total_activities: number
  total_kilojoules: number | null
  max_speed_kmh: number | null
  max_watts: number | null
  max_heartrate: number | null
  longest_ride_km: number | null
  longest_ride_name: string | null
  biggest_climb_m: number | null
  biggest_climb_name: string | null
  max_elevation_m: number | null
  avg_speed_kmh: number | null
  avg_watts: number | null
  avg_heartrate: number | null
  avg_distance_km: number | null
  avg_elevation_per_ride: number | null
  total_kudos: number
  total_pr_count: number
  total_suffer_score: number
  outdoor_activities: number
  indoor_activities: number
  current_streak_days: number
  longest_streak_days: number
  first_activity_date: string | null
  last_activity_date: string | null
  synced_at: string
}

export interface StoredActivity {
  id: number
  name: string
  type: string
  start_date: string
  distance_km: number
  elevation_m: number
  moving_time_s: number
  avg_speed_kmh: number | null
  max_speed_kmh: number | null
  avg_watts: number | null
  max_watts: number | null
  avg_heartrate: number | null
  max_heartrate: number | null
  avg_cadence: number | null
  kilojoules: number | null
  suffer_score: number | null
  pr_count: number
  kudos_count: number
  trainer: boolean
  gear_id: string | null
  summary_polyline: string | null
}

export interface StatsDisplay {
  heatmap: boolean
  heatmap_hide_virtual: boolean
  monthly_chart: boolean
  yearly_comparison: boolean
  records: boolean
  heart_rate: boolean
  power: boolean
  speed: boolean
  elevation_profile: boolean
  activity_types: boolean
  streaks: boolean
  energy: boolean
  kudos: boolean
  suffer_score: boolean
  recent_activities: boolean
  time_of_day: boolean
  weekday_distribution: boolean
  [key: string]: boolean
}

export interface Event {
  id: string
  name: string
  date: string
  location: string | null
  distance_km: number | null
  type: 'race' | 'gran_fondo' | 'training' | string
  url: string | null
  notes: string | null
  bike_id: string | null
}
