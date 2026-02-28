'use client'

import { StravaActivity } from '@/types'

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

const typeIcons: Record<string, string> = {
  Ride: '🚴',
  Run: '🏃',
  Swim: '🏊',
  Walk: '🚶',
  Hike: '⛰️',
  VirtualRide: '🖥️',
  GravelRide: '🚵',
}

export default function ActivityFeed({ activities }: { activities: StravaActivity[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Letzte Aktivitäten</h2>
      <div className="space-y-3">
        {activities.map(a => (
          <div key={a.id} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-primary/30 transition-colors">
            <div className="text-2xl flex-shrink-0">{typeIcons[a.type] ?? '🏅'}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{a.name}</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(a.start_date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div className="flex gap-6 text-sm flex-wrap">
              <div className="text-center">
                <p className="font-bold text-primary">{(a.distance / 1000).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">km</p>
              </div>
              <div className="text-center">
                <p className="font-bold">{formatDuration(a.moving_time)}</p>
                <p className="text-xs text-muted-foreground">Zeit</p>
              </div>
              <div className="text-center">
                <p className="font-bold">{Math.round(a.total_elevation_gain)}</p>
                <p className="text-xs text-muted-foreground">Hm</p>
              </div>
              {a.average_heartrate && (
                <div className="text-center">
                  <p className="font-bold">{Math.round(a.average_heartrate)}</p>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
