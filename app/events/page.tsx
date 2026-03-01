export const dynamic = 'force-dynamic'

import { getSupabase } from '@/lib/supabase'
import EventCountdown from '@/components/event-countdown'
import EventVisuals from '@/components/event-visuals'
import EuropeMap from '@/components/europe-map'
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
const countryNames: Record<string, string> = {
  DE: 'Deutschland', SE: 'Schweden', DK: 'Dänemark', IT: 'Italien',
}
const difficultyConfig: Record<string, { label: string; color: string; bars: number }> = {
  easy:    { label: 'Leicht',  color: 'bg-green-500',  bars: 1 },
  medium:  { label: 'Mittel',  color: 'bg-yellow-500', bars: 2 },
  hard:    { label: 'Schwer',  color: 'bg-orange-500', bars: 3 },
  extreme: { label: 'Extrem',  color: 'bg-red-500',    bars: 4 },
}
const typeConfig: Record<string, { label: string; color: string }> = {
  race:       { label: 'Rennen',     color: 'text-red-400 border-red-400/30 bg-red-400/10' },
  gran_fondo: { label: 'Gran Fondo', color: 'text-primary border-primary/30 bg-primary/10' },
}

// Pro Event: Karte + Elevation + Farbe + Startzeit + Wetter + Kartenpin + Fahrradtyp
const eventMeta: Record<string, {
  route: [number,number][],
  elevation: {d:number,e:number}[],
  color: string,
  textClass: string,
  dotClass: string,
  startTime: string,
  gradient: string,
  shortName: string,
  city: string,
  bikeType: 'road' | 'gravel',
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
    // Klimadaten: Neustrelitz, Mai — Quelle: DWD Klimanormen 1991–2020
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
    // Klimadaten: Motala (58°N), Juni — Quelle: SMHI Klimatnormaler 1991–2020
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
    // Klimadaten: Viborg/Jutland, Juni — Quelle: DMI Klimanormer 1991–2020
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
    // Klimadaten: Siena, Toskana, April — Quelle: climatestations.com 1991–2020
    weather: { tempMin: 10, tempMax: 19, rainDays: 10, windKmh: 13, sunrise: '06:20', label: 'Toskana, Mitte April' },
  },
}

export default async function EventsPage() {
  const events = await getEvents()
  const upcoming = events.filter(e => new Date(e.date) >= new Date())
  const past = events.filter(e => new Date(e.date) < new Date())

  const totalKm = Math.round(upcoming.reduce((s, e) => s + (e.distance_km ?? 0), 0))
  const countries = [...new Set(upcoming.map(e => e.country).filter(Boolean))]

  const mapPins = upcoming
    .filter(e => eventMeta[e.name])
    .map(e => {
      const meta = eventMeta[e.name]
      return {
        lat: meta.route[0][0],
        lon: meta.route[0][1],
        color: meta.color,
        label: meta.shortName,
        city: meta.city,
      }
    })

  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <p className="text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-3">Saison 2026</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-7xl md:text-8xl tracking-wider mb-2">RACE CALENDAR</h1>
          <p className="text-muted-foreground">Drei Länder. Drei Herausforderungen. Volle Attacke.</p>
          {/* Stats als Mini-Badges */}
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{upcoming.length}</span>
            <span>Events</span>
            <span>·</span>
            <span className="text-foreground font-semibold">~{totalKm}</span>
            <span>km</span>
            <span>·</span>
            <span className="text-foreground font-semibold">{countries.length}</span>
            <span>Länder</span>
          </div>
        </div>

        {/* Timeline + Europa-Karte (50/50, gleiche Höhe) */}
        {upcoming.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-4 mb-10 items-stretch">
            {/* Rennsaison 2026 Timeline */}
            <div className="flex-1 bg-card border border-border rounded-2xl p-5 sm:p-8">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-5">Rennsaison 2026</p>
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-0">
                  {upcoming.map((event, i) => {
                    const date = new Date(event.date)
                    const meta = eventMeta[event.name]
                    const fallbackDots = ['bg-blue-400','bg-yellow-400','bg-green-400','bg-purple-400']
                    const fallbackText = ['text-blue-400','text-yellow-400','text-green-400','text-purple-400']
                    const dotClass = meta?.dotClass ?? fallbackDots[i % fallbackDots.length]
                    const textClass = meta?.textClass ?? fallbackText[i % fallbackText.length]
                    return (
                      <div key={event.id} className={`flex items-start gap-4 ${i < upcoming.length - 1 ? 'pb-6' : ''}`}>
                        <div className={`mt-1.5 w-3.5 h-3.5 rounded-full flex-shrink-0 ${dotClass} ring-2 ring-background z-10`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-bold ${textClass}`}>
                              {date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                            </span>
                            {event.country && <span className="text-sm">{countryFlags[event.country]}</span>}
                            <span className="font-bold text-foreground text-sm">{event.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[
                              event.location,
                              event.distance_km
                                ? `${event.distance_km} km${event.elevation_m ? ` / ~${event.elevation_m.toLocaleString('de-DE')} Hm` : ''}`
                                : null,
                              meta?.startTime || null,
                            ].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Europa-Karte — gleiche Höhe via items-stretch */}
            <div className="lg:w-[45%] flex-shrink-0 min-h-[260px]">
              <EuropeMap pins={mapPins} />
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
          <div className="space-y-10">
            {upcoming.map((event, i) => {
              const date = new Date(event.date)
              const daysUntil = Math.ceil((date.getTime() - Date.now()) / 86400000)
              const diff = difficultyConfig[event.difficulty ?? 'hard']
              const type = typeConfig[event.type ?? 'gran_fondo']
              const meta = eventMeta[event.name]
              const fallbackGradients = [
                'from-blue-600/20 via-blue-900/10 to-transparent',
                'from-yellow-500/20 via-yellow-900/10 to-transparent',
                'from-green-600/20 via-green-900/10 to-transparent',
                'from-purple-600/20 via-purple-900/10 to-transparent',
              ]
              const gradient = meta?.gradient ?? fallbackGradients[i % fallbackGradients.length]
              const accentColor = meta?.color ?? '#a855f7'

              return (
                <div key={event.id} className={`relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br ${gradient} bg-card`}>
                  {/* Hintergrund-KM-Zahl */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 font-[family-name:var(--font-bebas)] text-[120px] sm:text-[180px] md:text-[220px] leading-none text-white/[0.03] select-none pointer-events-none">
                    {event.distance_km}
                  </div>

                  <div className="relative p-5 sm:p-8 md:p-10">
                    {/* Top Row */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                          ✓ Ich bin dabei
                        </span>
                        {event.type && (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${type.color}`}>
                            {type.label}
                          </span>
                        )}
                        {/* Status-Badge: Training oder Wettbewerb */}
                        {event.status === 'training'
                          ? <span className="px-2.5 py-1 rounded-full text-xs font-semibold border text-amber-400 border-amber-400/30 bg-amber-400/10">Training</span>
                          : <span className="px-2.5 py-1 rounded-full text-xs font-semibold border text-sky-400 border-sky-400/30 bg-sky-400/10">Wettbewerb</span>
                        }
                        {/* Bike-Type-Badge */}
                        {meta?.bikeType && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold border text-stone-400 border-stone-400/30 bg-stone-400/10">
                            {meta.bikeType === 'gravel' ? 'Gravel' : 'Rennrad'}
                          </span>
                        )}
                        {event.country && (
                          <span className="text-sm">{countryFlags[event.country]} {countryNames[event.country]}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          {daysUntil > 0 ? `in ${daysUntil} Tagen` : 'Heute!'}
                        </p>
                        <EventCountdown date={event.date} />
                      </div>
                    </div>

                    {/* Name + Datum */}
                    <div className="mb-6">
                      <h2 className="font-[family-name:var(--font-bebas)] text-3xl sm:text-5xl md:text-6xl tracking-wider leading-none mb-2">
                        {event.name}
                      </h2>
                      <p className="text-muted-foreground text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>📅 {date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        {meta?.startTime && <span>🕐 Start {meta.startTime}</span>}
                        {event.location && <span>📍 {event.location}</span>}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="bg-black/20 backdrop-blur rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold" style={{ color: accentColor }}>{event.distance_km}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">km</p>
                      </div>
                      {event.elevation_m && (
                        <div className="bg-black/20 backdrop-blur rounded-xl p-3 sm:p-4 text-center">
                          <p className="text-2xl sm:text-3xl font-bold">{event.elevation_m.toLocaleString('de-DE')}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Höhenmeter</p>
                        </div>
                      )}
                      {event.participants && (
                        <div className="bg-black/20 backdrop-blur rounded-xl p-3 sm:p-4 text-center">
                          <p className="text-2xl sm:text-3xl font-bold">{(event.participants / 1000).toFixed(0)}k+</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Teilnehmer</p>
                        </div>
                      )}
                      {diff && (
                        <div className="bg-black/20 backdrop-blur rounded-xl p-3 sm:p-4 text-center">
                          <div className="flex gap-1 justify-center mb-1.5">
                            {[1,2,3,4].map(n => (
                              <div key={n} className={`h-4 w-2.5 rounded-sm ${n <= diff.bars ? diff.color : 'bg-white/10'}`} />
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{diff.label}</p>
                        </div>
                      )}
                    </div>

                    {/* Historische Wetterdaten */}
                    {meta?.weather && (
                      <div className="mb-6 bg-black/20 backdrop-blur rounded-2xl p-4">
                        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
                          Ø Wetter · {meta.weather.label}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🌡️</span>
                            <div>
                              <p className="text-sm font-semibold">{meta.weather.tempMin}° – {meta.weather.tempMax}°C</p>
                              <p className="text-[10px] text-muted-foreground">Temperatur</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🌧️</span>
                            <div>
                              <p className="text-sm font-semibold">{meta.weather.rainDays} Tage</p>
                              <p className="text-[10px] text-muted-foreground">Regentage / Monat</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">💨</span>
                            <div>
                              <p className="text-sm font-semibold">Ø {meta.weather.windKmh} km/h</p>
                              <p className="text-[10px] text-muted-foreground">Wind</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🌅</span>
                            <div>
                              <p className="text-sm font-semibold">{meta.weather.sunrise} Uhr</p>
                              <p className="text-[10px] text-muted-foreground">Sonnenaufgang</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Karte + Höhenprofil */}
                    {meta && (
                      <EventVisuals
                        route={meta.route}
                        elevation={meta.elevation}
                        color={accentColor}
                        notes={event.notes}
                        distance_km={event.distance_km ?? 300}
                      />
                    )}

                    {/* Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5">
                      <p className="text-sm text-muted-foreground">
                        Siehst du mich auf der Strecke? Sag Hallo! 👋
                      </p>
                      {event.url && (
                        <a href={event.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
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
          <div className="mt-16 rounded-3xl border border-primary/20 bg-primary/5 p-8 sm:p-10 text-center">
            <p className="font-[family-name:var(--font-bebas)] text-3xl sm:text-5xl tracking-wider mb-3">
              TRIFF MICH AUF DER STRECKE
            </p>
            <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm sm:text-base">
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
