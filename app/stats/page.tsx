export const revalidate = 300

import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AthleteStats, StoredActivity, StatsDisplay } from '@/types'
import StatsShowcase from '@/components/stats-showcase'

export const metadata: Metadata = {
  title: 'Stats — Maik Malletschek',
  description: 'Strava-Statistiken, Heatmap, Rekorde und Analysen.',
}

const DEFAULT_DISPLAY: StatsDisplay = {
  heatmap: true,
  heatmap_hide_virtual: true,
  monthly_chart: true,
  yearly_comparison: true,
  records: true,
  heart_rate: false,
  power: true,
  speed: true,
  elevation_profile: true,
  activity_types: true,
  streaks: true,
  energy: true,
  kudos: true,
  suffer_score: true,
  recent_activities: true,
  time_of_day: true,
  weekday_distribution: true,
}

export default async function StatsPage() {
  const supabase = getSupabaseAdmin()

  const [statsRes, activitiesRes, settingsRes] = await Promise.all([
    supabase
      .from('athlete_stats')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single(),
    supabase
      .from('strava_activities')
      .select('*')
      .order('start_date', { ascending: false }),
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'stats_display')
      .single(),
  ])

  const athleteStats = statsRes.data as AthleteStats | null
  const allActivities = (activitiesRes.data ?? []) as StoredActivity[]
  const rawDisplay = (settingsRes.data?.value ?? {}) as Record<string, boolean>
  const display: StatsDisplay = { ...DEFAULT_DISPLAY }
  for (const key of Object.keys(rawDisplay)) {
    if (typeof rawDisplay[key] === 'boolean') {
      display[key] = rawDisplay[key]
    }
  }

  if (!athleteStats || allActivities.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-3">Strava</p>
            <h1 className="font-[family-name:var(--font-bebas)] text-6xl md:text-8xl tracking-wider">STATS</h1>
          </div>
          <div className="text-center py-32 text-muted-foreground">
            <p className="text-xl">Keine Statistiken verfügbar. Bitte Sync ausführen.</p>
          </div>
        </div>
      </div>
    )
  }

  // Filter sensitive data based on display settings
  // If heart_rate is disabled, strip HR data from activities and stats
  const filteredActivities: StoredActivity[] = allActivities.map(a => ({
    ...a,
    avg_heartrate: display.heart_rate ? a.avg_heartrate : null,
    max_heartrate: display.heart_rate ? a.max_heartrate : null,
    avg_watts: display.power ? a.avg_watts : null,
    max_watts: display.power ? a.max_watts : null,
    suffer_score: display.suffer_score ? a.suffer_score : null,
    kilojoules: display.energy ? a.kilojoules : null,
  }))

  const filteredStats: AthleteStats = {
    ...athleteStats,
    avg_heartrate: display.heart_rate ? athleteStats.avg_heartrate : null,
    max_heartrate: display.heart_rate ? athleteStats.max_heartrate : null,
    avg_watts: display.power ? athleteStats.avg_watts : null,
    max_watts: display.power ? athleteStats.max_watts : null,
    total_suffer_score: display.suffer_score ? athleteStats.total_suffer_score : 0,
    total_kilojoules: display.energy ? athleteStats.total_kilojoules : null,
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4">
        <p className="text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-3">Strava</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-7xl md:text-8xl tracking-wider">STATS</h1>
      </div>

      <StatsShowcase
        stats={filteredStats}
        activities={filteredActivities}
        display={display}
      />
    </div>
  )
}
