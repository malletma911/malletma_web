export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/session'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'
import { StravaActivity } from '@/types'

async function getLatestActivity(email: string): Promise<StravaActivity | null> {
  const supabase = getSupabase()
  const { data: tokenRow } = await supabase
    .from('oauth_tokens')
    .select('access_token, expires_at, refresh_token')
    .eq('user_email', email)
    .eq('provider', 'strava')
    .single()

  if (!tokenRow) return null

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
    if (!refreshRes.ok) return null
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

  const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=1', {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 300 },
  })
  if (!res.ok) return null
  const activities = await res.json()
  return activities[0] ?? null
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

export default async function HomePage() {
  const session = await getSession()
  const latest = session ? await getLatestActivity(session.email) : null

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
          <p className="text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">Radsport &amp; Leidenschaft</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-8xl md:text-[10rem] leading-none tracking-wider mb-6">
            MAIK<br />
            <span className="text-primary">MALLETSCHEK</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Rennrad, Gravel, Events — meine Leidenschaft für den Radsport, festgehalten in Daten und Geschichten.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/stats" className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors">
              Meine Stats
            </Link>
            <Link href="/garage" className="px-8 py-3 border border-border rounded-full font-semibold hover:bg-white/5 transition-colors">
              Zur Garage
            </Link>
          </div>
        </div>
      </section>

      {/* Letzte Aktivität */}
      {latest && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-4">Zuletzt auf dem Rad</p>
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">{latest.name}</h2>
                <p className="text-muted-foreground text-sm">
                  {new Date(latest.start_date).toLocaleDateString('de-DE', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{(latest.distance / 1000).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">km</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{formatDuration(latest.moving_time)}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Zeit</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{Math.round(latest.total_elevation_gain)}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Hm</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Strava nicht verbunden */}
      {!latest && session && (
        <section className="max-w-6xl mx-auto px-6 py-16 text-center">
          <p className="text-muted-foreground mb-4">Strava noch nicht verbunden.</p>
          <a href="/api/strava/connect" className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors inline-block">
            Strava verbinden
          </a>
        </section>
      )}

      {/* Quick Links */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { href: '/garage', title: 'Garage', desc: 'Meine Fahrräder', icon: '🚲' },
          { href: '/stats', title: 'Stats', desc: 'Strava-Aktivitäten & Charts', icon: '📊' },
          { href: '/events', title: 'Events', desc: 'Bevorstehende Rennen', icon: '🏁' },
        ].map(card => (
          <Link key={card.href} href={card.href}
            className="group bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all">
            <div className="text-4xl mb-4">{card.icon}</div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{card.title}</h3>
            <p className="text-muted-foreground text-sm">{card.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
