export const revalidate = 300

import type { Metadata } from 'next'
import { getSupabase } from '@/lib/supabase'
import type { Bike, BikeStravaStats } from '@/types'
import BikeShowcase from '@/components/bike-showcase'

export const metadata: Metadata = {
  title: 'Garage — Maik Malletschek',
  description: 'Meine Fahrräder und Equipment.',
}

async function getBikesWithStats(): Promise<{
  bikes: Bike[]
  stats: Record<string, BikeStravaStats>
}> {
  const supabase = getSupabase()

  const [bikesRes, statsRes] = await Promise.all([
    supabase
      .from('bikes')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true }),
    supabase
      .from('bike_strava_stats')
      .select('*'),
  ])

  if (bikesRes.error) {
    console.error('Failed to fetch bikes:', bikesRes.error.message)
  }
  if (statsRes.error) {
    console.error('Failed to fetch bike stats:', statsRes.error.message)
  }

  const bikes = (bikesRes.data ?? []) as Bike[]
  const stats: Record<string, BikeStravaStats> = {}
  for (const s of (statsRes.data ?? []) as BikeStravaStats[]) {
    stats[s.bike_id] = s
  }

  return { bikes, stats }
}

export default async function GaragePage() {
  const { bikes, stats } = await getBikesWithStats()

  const totalKm = Object.values(stats).reduce((sum, s) => sum + Number(s.total_distance_km || 0), 0)
  const totalElevation = Object.values(stats).reduce((sum, s) => sum + Number(s.total_elevation_m || 0), 0)

  return (
    <div className="min-h-screen pt-24 pb-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
        <p className="text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-3">Meine Bikes</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-7xl md:text-8xl tracking-wider">GARAGE</h1>
        {bikes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="px-3 py-2 rounded-lg border border-white/8 bg-white/[0.03]">
              <p className="text-base font-bold tabular-nums leading-none text-foreground">{bikes.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Bikes</p>
            </div>
            {totalKm > 0 && (
              <div className="px-3 py-2 rounded-lg border border-white/8 bg-white/[0.03]">
                <p className="text-base font-bold tabular-nums leading-none text-foreground">
                  {totalKm.toLocaleString('de-DE', { maximumFractionDigits: 0 })} km
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Gesamtstrecke</p>
              </div>
            )}
            {totalElevation > 0 && (
              <div className="px-3 py-2 rounded-lg border border-white/8 bg-white/[0.03]">
                <p className="text-base font-bold tabular-nums leading-none text-foreground">
                  {totalElevation.toLocaleString('de-DE', { maximumFractionDigits: 0 })} hm
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Höhenmeter</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bike Showcase */}
      {bikes.length === 0 ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center py-32 text-muted-foreground">
            <p className="text-xl">Noch keine Fahrräder eingetragen.</p>
          </div>
        </div>
      ) : (
        <BikeShowcase bikes={bikes} stats={stats} allStats={stats} />
      )}
    </div>
  )
}
