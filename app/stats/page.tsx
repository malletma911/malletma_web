export const revalidate = 300

import type { Metadata } from 'next'
import { getStravaActivities } from '@/lib/strava'
import ActivityFeed from '@/components/activity-feed'

export const metadata: Metadata = {
  title: 'Stats — Maik Malletschek',
  description: 'Strava-Statistiken und letzte Aktivitäten.',
}

export default async function StatsPage() {
  const activities = await getStravaActivities(process.env.STRAVA_OWNER_EMAIL ?? '', 30)

  const totalKm = activities.reduce((sum, a) => sum + a.distance, 0) / 1000
  const totalTime = activities.reduce((sum, a) => sum + a.moving_time, 0)
  const totalElevation = activities.reduce((sum, a) => sum + a.total_elevation_gain, 0)

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <p className="text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-3">Strava</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-6xl md:text-8xl tracking-wider">STATS</h1>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-32 text-muted-foreground">
            <p className="text-xl">Keine Strava-Aktivitäten gefunden.</p>
          </div>
        ) : (
          <>
            {/* Zusammenfassung */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              {[
                { label: 'km (letzte 30)', value: totalKm.toFixed(0) },
                { label: 'Stunden', value: (totalTime / 3600).toFixed(1) },
                { label: 'Höhenmeter', value: Math.round(totalElevation).toLocaleString('de-DE') },
              ].map(stat => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 sm:p-6 text-center">
                  <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Aktivitäts-Feed (Client Component für Interaktivität) */}
            <ActivityFeed activities={activities} />
          </>
        )}
      </div>
    </div>
  )
}
