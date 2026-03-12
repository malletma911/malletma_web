export const revalidate = 300

import type { Metadata } from 'next'
import { getSupabase } from '@/lib/supabase'
import { countryFlag, countryName } from '@/lib/country'
import EventsFilterableContent, { EnrichedEvent } from '@/components/events-filterable-content'

export const metadata: Metadata = {
  title: 'Race Calendar — Maik Malletschek',
  description: 'Bevorstehende Rad-Events und Rennen.',
}

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
  slug: string | null
  route_polyline: [number, number][] | null
  elevation_profile: { d: number; e: number }[] | null
  color: string | null
  short_name: string | null
  city: string | null
  bike_type: string | null
  participation: string | null
  start_time: string | null
  gradient_class: string | null
  bike_id: string | null
  bike: { id: string; name: string; brand: string | null; model: string | null }[] | { id: string; name: string; brand: string | null; model: string | null } | null
}

const EVENT_COLUMNS = 'id,name,date,location,distance_km,elevation_m,type,url,notes,country,participants,difficulty,status,slug,route_polyline,elevation_profile,color,short_name,city,bike_type,participation,start_time,gradient_class,bike_id,bike:bikes!bike_id(id,name,brand,model)'

async function getEvents(): Promise<EventRow[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .or('status.eq.published,status.eq.active')
    .order('date', { ascending: true })
  if (error) {
    console.error('Failed to fetch events:', error.message)
    return []
  }
  return data ?? []
}

const DEFAULT_COLOR = '#a1a1aa'

export default async function EventsPage() {
  const events = await getEvents()
  const now = new Date()
  const upcoming = events.filter(e => new Date(e.date) >= now)
  const past     = events.filter(e => new Date(e.date) < now)

  const enriched: EnrichedEvent[] = upcoming.map(e => {
    const route = e.route_polyline ?? []
    const elevation = e.elevation_profile ?? []
    const color = e.color ?? DEFAULT_COLOR
    return {
      id: e.id,
      name: e.name,
      date: e.date,
      location: e.location,
      distance_km: e.distance_km,
      elevation_m: e.elevation_m,
      type: e.type,
      url: e.url,
      notes: e.notes,
      country: e.country,
      participants: e.participants,
      difficulty: e.difficulty,
      slug: e.slug,
      lat: route.length > 0 ? route[0][0] : 0,
      lon: route.length > 0 ? route[0][1] : 0,
      route,
      elevation,
      color,
      startTime: e.start_time ?? '',
      shortName: e.short_name ?? e.name,
      city: e.city ?? e.location ?? '',
      bikeType: e.bike_type ?? 'road',
      participation: e.participation ?? 'planned',
      bike: Array.isArray(e.bike) ? (e.bike[0] ?? null) : (e.bike ?? null),
    }
  })

  const totalKm       = Math.round(upcoming.reduce((s, e) => s + (e.distance_km ?? 0), 0))
  const totalElevation = Math.round(upcoming.reduce((s, e) => s + (e.elevation_m ?? 0), 0))
  const countries     = [...new Set(upcoming.map(e => e.country).filter(Boolean))]

  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <p className="text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-3">Saison 2026</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-7xl md:text-8xl tracking-wider mb-2">RACE CALENDAR</h1>
          <p className="text-muted-foreground">
            {countries.length} {countries.length === 1 ? 'Land' : 'Länder'}.{' '}
            {upcoming.length} {upcoming.length === 1 ? 'Herausforderung' : 'Herausforderungen'}. Volle Attacke.
          </p>
          {/* Stats */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              { value: String(upcoming.length),                              label: 'Events'      },
              { value: totalKm.toLocaleString('de-DE'),                       label: 'km'          },
              { value: totalElevation.toLocaleString('de-DE'),               label: 'Höhenmeter'  },
              { value: String(countries.length),                             label: 'Länder'      },
            ].map(s => (
              <div key={s.label} className="px-3 py-2 rounded-lg border border-white/8 bg-white/[0.03]">
                <p className="text-base font-bold tabular-nums leading-none text-foreground">{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter + Timeline + Karte + Event Cards */}
        {upcoming.length > 0 ? (
          <EventsFilterableContent events={enriched} />
        ) : (
          <div className="text-center py-32 text-muted-foreground">
            <p className="text-6xl mb-6">🏁</p>
            <p className="text-xl">Keine bevorstehenden Events.</p>
          </div>
        )}

        {/* Community CTA */}
        {upcoming.length > 0 && (
          <div className="mt-16 rounded-3xl border border-primary/20 bg-primary/5 p-8 sm:p-10 text-center">
            <p className="font-[family-name:var(--font-bebas)] text-3xl sm:text-5xl tracking-wider mb-3">
              TRIFF MICH AUF DER STRECKE
            </p>
            <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm sm:text-base">
              Ich freue mich über jeden, der dabei ist. Folge mir auf Strava und behalte meinen Fortschritt im Blick.
            </p>
            <a
              href="https://www.strava.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors"
            >
              Auf Strava folgen
            </a>
          </div>
        )}

        {/* Vergangene Events */}
        {past.length > 0 && (
          <div className="mt-16">
            <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-muted-foreground mb-4">ABSOLVIERT</h2>
            <div className="space-y-3">
              {past.map(event => (
                <div key={event.id} className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-3 opacity-60">
                  <span className="text-xl">{event.country ? countryFlag(event.country) : '🏁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold line-through truncate">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('de-DE')}
                      {event.country && ` · ${countryName(event.country)}`}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground flex-shrink-0">
                    {event.distance_km} km
                    {event.elevation_m ? ` · ${event.elevation_m.toLocaleString('de-DE')} Hm` : ''}
                    {' '}✓
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
