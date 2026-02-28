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
  suffer_score?: number
}

export interface Bike {
  id: string
  name: string
  brand: string | null
  type: 'road' | 'gravel' | 'mtb' | 'tt' | string
  photo_url: string | null
  description: string | null
  weight_kg: number | null
  year: number | null
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
}
