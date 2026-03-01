export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/session'
import { getSupabase } from '@/lib/supabase'
import { StravaActivity } from '@/types'
import ActivityFeed from '@/components/activity-feed'

async function getActivities(email: string): Promise<StravaActivity[]> {
  const supabase = getSupabase()
  const { data: tokenRow } = await supabase
    .from('oauth_tokens')
    .select('access_token, expires_at, refresh_token')
    .eq('user_email', email)
    .eq('provider', 'strava')
    .single()

  if (!tokenRow) return []

  let accessToken = tokenRow.access_token
  if (new Date(tokenRow.expires_at) < new Date()) {
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
    if (!refreshRes.ok) return []
    const refreshed = await refreshRes.json()
    accessToken = refreshed.access_token
    await supabase.from('oauth_tokens').upsert({
      user_email: email,
      provider: 'strava',
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
    }, { onConflict: 'user_email,provider' })
  }

  const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 300 },
  })
  if (!res.ok) return []
  return res.json()
}

export default async function StatsPage() {
  const session = await getSession()
  if (!session) return null

  const activities = await getActivities(session.email)

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
            <p className="text-xl mb-4">Keine Strava-Aktivitäten gefunden.</p>
            <a href="/api/strava/connect" className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors inline-block">
              Strava verbinden
            </a>
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
