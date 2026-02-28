export const dynamic = 'force-dynamic'

import { getSupabase } from '@/lib/supabase'
import EventCountdown from '@/components/event-countdown'
import Link from 'next/link'

interface EventRow {
  id: string
  name: string
  date: string
  location: string | null
  distance_km: number | null
  elevation_m: number | null
  type: string | null
  url: string | null
  notes: string | null
  country: string | null
  participants: number | null
  difficulty: string | null
  status: string | null
}

async function getEvents(): Promise<EventRow[]> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
  return data ?? []
}

const countryFlags: Record<string, string> = {
  DE: '🇩🇪', SE: '🇸🇪', DK: '🇩🇰', AT: '🇦🇹', CH: '🇨🇭', FR: '🇫🇷', IT: '🇮🇹',
}

const countryNames: Record<string, string> = {
  DE: 'Deutschland', SE: 'Schweden', DK: 'Dänemark',
}

const difficultyConfig: Record<string, { label: string; color: string; bars: number }> = {
  easy:    { label: 'Leicht',   color: 'bg-green-500',  bars: 1 },
  medium:  { label: 'Mittel',   color: 'bg-yellow-500', bars: 2 },
  hard:    { label: 'Schwer',   color: 'bg-orange-500', bars: 3 },
  extreme: { label: 'Extrem',   color: 'bg-red-500',    bars: 4 },
}

const typeConfig: Record<string, { label: string; color: string }> = {
  race:       { label: 'Rennen',     color: 'text-red-400 border-red-400/30 bg-red-400/10' },
  gran_fondo: { label: 'Gran Fondo', color: 'text-primary border-primary/30 bg-primary/10' },
  training:   { label: 'Training',   color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
}

const cardGradients = [
  'from-orange-600/20 via-red-900/10 to-transparent',
  'from-blue-600/20 via-indigo-900/10 to-transparent',
  'from-red-600/20 via-pink-900/10 to-transparent',
  'from-green-600/20 via-emerald-900/10 to-transparent',
]

export default async function EventsPage() {
  const events = await getEvents()

  const upcoming = events.filter(e => new Date(e.date) >= new Date())
  const past = events.filter(e => new Date(e.date) < new Date())

  const totalKm = upcoming.reduce((s, e) => s + (e.distance_km ?? 0), 0)
  const countries = [...new Set(upcoming.map(e => e.country).filter(Boolean))]

  return (
    <div className="min-h-screen pt-24 pb-24">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-6">
          <p className="text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-3">Saison 2026</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-6xl md:text-8xl tracking-wider mb-2">RACE CALENDAR</h1>
          <p className="text-muted-foreground max-w-xl">
            Drei Länder. Drei Herausforderungen. Volle Attacke.
          </p>
        </div>

        {/* Saison-Stats */}
        {upcoming.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-10 max-w-lg">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-primary">{upcoming.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Events</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-primary">{totalKm.toLocaleString('de-DE')}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">km gesamt</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-primary">{countries.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Länder</p>
            </div>
          </div>
        )}

        {/* Timeline-Kalender */}
        {upcoming.length > 0 && (
          <div className="mb-16 bg-card border border-border rounded-2xl p-6 md:p-8">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-6">Rennsaison 2026</p>
            <div className="relative">
              {/* Vertikale Linie */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-0">
                {upcoming.map((event, i) => {
                  const date = new Date(event.date)
                  const dotColors = ['bg-blue-400', 'bg-yellow-400', 'bg-green-400', 'bg-orange-400', 'bg-purple-400']
                  const textColors = ['text-blue-400', 'text-yellow-400', 'text-green-400', 'text-orange-400', 'text-purple-400']
                  const dotColor = dotColors[i % dotColors.length]
                  const textColor = textColors[i % textColors.length]
                  const isLast = i === upcoming.length - 1

                  return (
                    <div key={event.id} className={`flex items-start gap-5 ${!isLast ? 'pb-7' : ''}`}>
                      {/* Dot */}
                      <div className={`mt-1 w-[15px] h-[15px] rounded-full flex-shrink-0 ${dotColor} ring-2 ring-background z-10`} />
                      {/* Content */}
                      <div className="flex-1 flex flex-col md:flex-row md:items-start md:justify-between gap-1 md:gap-4 min-w-0">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-bold ${textColor}`}>
                              {date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }).replace('.', '.')}
                            </span>
                            {event.country && <span className="text-sm">{countryFlags[event.country]}</span>}
                            <span className="font-bold text-foreground">{event.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {[event.location, event.distance_km ? `${event.distance_km} km` : null]
                              .filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        {event.elevation_m && (
                          <span className={`text-sm font-semibold flex-shrink-0 ${textColor}`}>
                            ~{event.elevation_m.toLocaleString('de-DE')} Hm
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Event Cards */}
        {upcoming.length === 0 ? (
          <div className="text-center py-32 text-muted-foreground">
            <p className="text-6xl mb-6">🏁</p>
            <p className="text-xl">Keine bevorstehenden Events.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.map((event, i) => {
              const date = new Date(event.date)
              const daysUntil = Math.ceil((date.getTime() - Date.now()) / 86400000)
              const diff = difficultyConfig[event.difficulty ?? 'hard']
              const type = typeConfig[event.type ?? 'gran_fondo']
              const gradient = cardGradients[i % cardGradients.length]

              return (
                <div key={event.id}
                  className={`relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br ${gradient} bg-card`}>

                  {/* Hintergrund-Zahl */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 font-[family-name:var(--font-bebas)] text-[160px] md:text-[220px] leading-none text-white/[0.03] select-none pointer-events-none">
                    {event.distance_km}
                  </div>

                  <div className="relative p-8 md:p-10">
                    {/* Top Row */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Ich bin dabei Badge */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                          ✓ Ich bin dabei
                        </span>
                        {event.type && (
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${type.color}`}>
                            {type.label}
                          </span>
                        )}
                        {event.country && (
                          <span className="text-sm">
                            {countryFlags[event.country]} {countryNames[event.country] ?? event.country}
                          </span>
                        )}
                      </div>
                      {/* Countdown */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          {daysUntil > 0 ? `in ${daysUntil} Tagen` : 'Heute!'}
                        </p>
                        <EventCountdown date={event.date} />
                      </div>
                    </div>

                    {/* Event Name + Datum */}
                    <div className="mb-6">
                      <h2 className="font-[family-name:var(--font-bebas)] text-4xl md:text-6xl tracking-wider leading-none mb-2">
                        {event.name}
                      </h2>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <span>📅</span>
                        {date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {event.location && <> · <span>📍</span>{event.location}</>}
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-black/20 backdrop-blur rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-primary">{event.distance_km}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">km</p>
                      </div>
                      {event.elevation_m && (
                        <div className="bg-black/20 backdrop-blur rounded-2xl p-4 text-center">
                          <p className="text-3xl font-bold">{event.elevation_m.toLocaleString('de-DE')}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Höhenmeter</p>
                        </div>
                      )}
                      {event.participants && (
                        <div className="bg-black/20 backdrop-blur rounded-2xl p-4 text-center">
                          <p className="text-3xl font-bold">{(event.participants / 1000).toFixed(0)}k+</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Teilnehmer</p>
                        </div>
                      )}
                      {diff && (
                        <div className="bg-black/20 backdrop-blur rounded-2xl p-4 text-center">
                          <div className="flex gap-1 justify-center mb-1">
                            {[1, 2, 3, 4].map(n => (
                              <div key={n} className={`h-5 w-3 rounded-sm ${n <= diff.bars ? diff.color : 'bg-white/10'}`} />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{diff.label}</p>
                        </div>
                      )}
                    </div>

                    {/* Beschreibung */}
                    {event.notes && (
                      <p className="text-muted-foreground text-sm mb-6 max-w-2xl leading-relaxed">
                        {event.notes}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                      <p className="text-sm text-muted-foreground">
                        Siehst du mich auf der Strecke? Sag Hallo! 👋
                      </p>
                      {event.url && (
                        <a href={event.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
                          Event-Website →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Community CTA */}
        {upcoming.length > 0 && (
          <div className="mt-20 rounded-3xl border border-primary/20 bg-primary/5 p-10 text-center">
            <p className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl tracking-wider mb-3">
              TRIFF MICH AUF DER STRECKE
            </p>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Ich freue mich über jeden, der dabei ist. Folge mir auf Strava und behalte meinen Fortschritt im Blick.
            </p>
            <a href="https://www.strava.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors">
              Auf Strava folgen
            </a>
          </div>
        )}

        {/* Vergangene Events */}
        {past.length > 0 && (
          <div className="mt-20">
            <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wider text-muted-foreground mb-6">ABSOLVIERT</h2>
            <div className="space-y-3">
              {past.map(event => (
                <div key={event.id} className="flex items-center gap-4 bg-card border border-border rounded-xl px-6 py-4 opacity-60">
                  <span className="text-xl">{countryFlags[event.country ?? ''] ?? '🏁'}</span>
                  <div className="flex-1">
                    <p className="font-semibold line-through">{event.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.distance_km} km ✓</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
