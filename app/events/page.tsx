export const dynamic = 'force-dynamic'

import { getSupabase } from '@/lib/supabase'
import EventsFilterableContent, { EnrichedEvent } from '@/components/events-filterable-content'

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
  route_polyline: unknown
  elevation_profile: unknown
  color: string | null
  short_name: string | null
  city: string | null
  bike_type: string | null
  participation: string | null
  start_time: string | null
  gradient_class: string | null
}

async function getEvents(): Promise<EventRow[]> {
  const supabase = getSupabase()
  const { data } = await supabase.from('events').select('*').order('date', { ascending: true })
  return data ?? []
}

const countryFlags: Record<string, string> = {
  DE: '🇩🇪', SE: '🇸🇪', DK: '🇩🇰', IT: '🇮🇹', AT: '🇦🇹',
}

// Wetterdaten bleiben vorerst hardcoded (keyed by slug)
const weatherBySlug: Record<string, {
  tempMin: number; tempMax: number; rainDays: number; windKmh: number; sunrise: string; label: string
}> = {
  'msr-300': { tempMin: 8, tempMax: 19, rainDays: 11, windKmh: 14, sunrise: '05:02', label: 'Mecklenburg, Ende Mai' },
  'vatternrundan-315': { tempMin: 10, tempMax: 21, rainDays: 10, windKmh: 11, sunrise: '03:58', label: 'Mittelschweden, Mitte Juni' },
  'letape-denmark': { tempMin: 10, tempMax: 20, rainDays: 12, windKmh: 19, sunrise: '04:28', label: 'Jütland, Ende Juni' },
  'strade-bianche': { tempMin: 10, tempMax: 19, rainDays: 10, windKmh: 13, sunrise: '06:20', label: 'Toskana, Mitte April' },
  'kitzbueheler-radmarathon': { tempMin: 6, tempMax: 16, rainDays: 12, windKmh: 12, sunrise: '06:32', label: 'Kitzbühel/Tirol, Anfang September' },
}

const DEFAULT_COLOR = '#a1a1aa'

/** Normalize route_polyline: handles both [lat,lng][] tuples and {lat,lng}[] objects */
function normalizePolyline(raw: unknown): [number, number][] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const first = raw[0]
  if (Array.isArray(first) && typeof first[0] === 'number') return raw as [number, number][]
  if (typeof first === 'object' && first !== null && 'lat' in first && 'lng' in first) {
    return raw.map((p: { lat: number; lng: number }) => [p.lat, p.lng] as [number, number])
  }
  return []
}

/** Normalize elevation_profile: handles both {d,e}[] and {distance_km, elevation_m}[] */
function normalizeElevation(raw: unknown): { d: number; e: number }[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const first = raw[0]
  if (typeof first === 'object' && first !== null && 'd' in first && 'e' in first) return raw as { d: number; e: number }[]
  if (typeof first === 'object' && first !== null && 'distance_km' in first) {
    return raw.map((p: { distance_km: number; elevation_m: number }) => ({
      d: Math.round(p.distance_km * 10) / 10,
      e: Math.round(p.elevation_m),
    }))
  }
  return []
}

export default async function EventsPage() {
  const events = await getEvents()
  const isPublished = (e: EventRow) => e.status === 'published' || e.status === 'active'
  const upcoming = events.filter(e => new Date(e.date) >= new Date() && isPublished(e))
  const past     = events.filter(e => new Date(e.date) < new Date() && isPublished(e))

  // Enrich DB rows → EnrichedEvent[] (nur published Events)
  const enriched: EnrichedEvent[] = upcoming.map(e => {
    const route = normalizePolyline(e.route_polyline)
    const elevation = normalizeElevation(e.elevation_profile)
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
      weather: e.slug ? weatherBySlug[e.slug] : undefined,
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

        {/* Filter + Timeline + Karte + Event Cards — alles Client-seitig */}
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
                  <span className="text-xl">{countryFlags[event.country ?? ''] ?? '🏁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold line-through truncate">{event.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <p className="text-sm text-muted-foreground flex-shrink-0">{event.distance_km} km ✓</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
