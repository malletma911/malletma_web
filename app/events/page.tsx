export const dynamic = 'force-dynamic'

import { getSupabase } from '@/lib/supabase'
import EventsFilterableContent, { EnrichedEvent } from '@/components/events-filterable-content'
import {
  MSR_ROUTE, MSR_ELEVATION,
  VATTERN_ROUTE, VATTERN_ELEVATION,
  LETAPE_ROUTE, LETAPE_ELEVATION,
  STRADE_ROUTE, STRADE_ELEVATION,
} from '@/lib/event-data'

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
  const { data } = await supabase.from('events').select('*').order('date', { ascending: true })
  return data ?? []
}

const countryFlags: Record<string, string> = {
  DE: '🇩🇪', SE: '🇸🇪', DK: '🇩🇰', IT: '🇮🇹',
}

// Per-Event Metadaten (Karte, Farbe, Wetter, …)
const eventMeta: Record<string, {
  route: [number, number][]
  elevation: { d: number; e: number }[]
  color: string
  textClass: string
  dotClass: string
  startTime: string
  gradient: string
  shortName: string
  city: string
  bikeType: 'road' | 'gravel'
  participation: 'confirmed' | 'planned'
  weather: { tempMin: number; tempMax: number; rainDays: number; windKmh: number; sunrise: string; label: string }
}> = {
  'Mecklenburger Seen Runde 300': {
    route: MSR_ROUTE,
    elevation: MSR_ELEVATION,
    color: '#60a5fa',
    textClass: 'text-blue-400',
    dotClass: 'bg-blue-400',
    startTime: '06:20 Uhr',
    gradient: 'from-blue-600/20 via-blue-900/10 to-transparent',
    shortName: 'MSR 300',
    city: 'Neustrelitz',
    bikeType: 'road',
    participation: 'confirmed',
    weather: { tempMin: 8, tempMax: 19, rainDays: 11, windKmh: 14, sunrise: '05:02', label: 'Mecklenburg, Ende Mai' },
  },
  'Vätternrundan 315': {
    route: VATTERN_ROUTE,
    elevation: VATTERN_ELEVATION,
    color: '#facc15',
    textClass: 'text-yellow-400',
    dotClass: 'bg-yellow-400',
    startTime: '04:56 Uhr',
    gradient: 'from-yellow-500/20 via-yellow-900/10 to-transparent',
    shortName: 'Vätternrundan',
    city: 'Motala',
    bikeType: 'road',
    participation: 'confirmed',
    weather: { tempMin: 10, tempMax: 21, rainDays: 10, windKmh: 11, sunrise: '03:58', label: 'Mittelschweden, Mitte Juni' },
  },
  "L'Étape Denmark — Hærvejsløbet": {
    route: LETAPE_ROUTE,
    elevation: LETAPE_ELEVATION,
    color: '#4ade80',
    textClass: 'text-green-400',
    dotClass: 'bg-green-400',
    startTime: '',
    gradient: 'from-green-600/20 via-green-900/10 to-transparent',
    shortName: "L'Étape DK",
    city: 'Flensburg',
    bikeType: 'road',
    participation: 'confirmed',
    weather: { tempMin: 10, tempMax: 20, rainDays: 12, windKmh: 19, sunrise: '04:28', label: 'Jütland, Ende Juni' },
  },
  'STRADE BIANCHE': {
    route: STRADE_ROUTE,
    elevation: STRADE_ELEVATION,
    color: '#f97316',
    textClass: 'text-orange-400',
    dotClass: 'bg-orange-400',
    startTime: '',
    gradient: 'from-orange-600/20 via-orange-900/10 to-transparent',
    shortName: 'Strade Bianche',
    city: 'Siena',
    bikeType: 'gravel',
    participation: 'confirmed',
    weather: { tempMin: 10, tempMax: 19, rainDays: 10, windKmh: 13, sunrise: '06:20', label: 'Toskana, Mitte April' },
  },
}

export default async function EventsPage() {
  const events = await getEvents()
  const upcoming = events.filter(e => new Date(e.date) >= new Date())
  const past     = events.filter(e => new Date(e.date) < new Date())

  // Merge DB rows with eventMeta → EnrichedEvent[]
  const enriched: EnrichedEvent[] = upcoming
    .filter(e => eventMeta[e.name])
    .map(e => {
      const meta = eventMeta[e.name]
      return {
        ...e,
        ...meta,
        lat: meta.route[0][0],
        lon: meta.route[0][1],
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
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
            <span className="text-foreground font-semibold">{upcoming.length}</span>
            <span>Events</span>
            <span>·</span>
            <span className="text-foreground font-semibold">~{totalKm.toLocaleString('de-DE')}</span>
            <span>km</span>
            <span>·</span>
            <span className="text-foreground font-semibold">~{totalElevation.toLocaleString('de-DE')}</span>
            <span>Hm</span>
            <span>·</span>
            <span className="text-foreground font-semibold">{countries.length}</span>
            <span>Länder</span>
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
