'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo } from 'react'
import EventFilters, { FilterState, FilterGroup, defaultFilters } from './event-filters'
import EventCountdown from './event-countdown'
import EventVisuals from './event-visuals'
import { countryFlag, countryName } from '@/lib/country'

const OverviewMap = dynamic(() => import('./overview-map'), { ssr: false })

const difficultyConfig: Record<string, { label: string; color: string; bars: number }> = {
  easy:    { label: 'Leicht',  color: 'bg-green-500',  bars: 1 },
  medium:  { label: 'Mittel',  color: 'bg-yellow-500', bars: 2 },
  hard:    { label: 'Schwer',  color: 'bg-orange-500', bars: 3 },
  extreme: { label: 'Extrem',  color: 'bg-red-500',    bars: 4 },
}
const modusConfig: Record<string, { label: string; color: string }> = {
  training:   { label: 'Training',   color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
  race:       { label: 'Rennen',     color: 'text-red-400 border-red-400/30 bg-red-400/10' },
  gran_fondo: { label: 'Gran Fondo', color: 'text-primary border-primary/30 bg-primary/10' },
  charity:    { label: 'Charity',    color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
}
const bikeTypeLabels: Record<string, string> = {
  road: 'Rennrad', gravel: 'Gravel', mtb: 'MTB',
}

export interface EnrichedEvent {
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
  lat: number
  lon: number
  route: [number, number][]
  elevation: { d: number; e: number }[]
  color: string
  startTime: string
  shortName: string
  city: string
  bikeType: string
  participation: string
  slug: string | null
}

type ModusValue = 'training' | 'race' | 'gran_fondo' | 'charity'

function getEventModus(e: EnrichedEvent): ModusValue {
  if (e.type === 'training') return 'training'
  if (e.type === 'race') return 'race'
  if (e.type === 'charity') return 'charity'
  return 'gran_fondo'
}

function normalizeBikeType(b: string): string {
  return (b === 'road' || b === 'gravel' || b === 'mtb') ? b : 'road'
}

function applyFilters(events: EnrichedEvent[], filters: FilterState): EnrichedEvent[] {
  return events.filter(e => {
    if (!filters.bikeType.has(normalizeBikeType(e.bikeType))) return false
    if (filters.country.size > 0 && !filters.country.has(e.country ?? '')) return false
    return true
  })
}

function computeFilterGroups(events: EnrichedEvent[]): FilterGroup[] {
  const countries = [...new Set(events.map(e => e.country).filter(Boolean))] as string[]

  const dims: { key: string; options: { value: string; label: string }[]; get: (e: EnrichedEvent) => string }[] = [
    {
      key: 'bikeType',
      options: [
        { value: 'road',   label: 'Rennrad' },
        { value: 'gravel', label: 'Gravel' },
        { value: 'mtb',    label: 'MTB' },
      ],
      get: e => normalizeBikeType(e.bikeType),
    },
    {
      key: 'country',
      options: countries.sort().map(code => ({
        value: code,
        label: `${countryFlag(code)} ${countryName(code)}`,
      })),
      get: e => e.country ?? '',
    },
  ]

  return dims
    .map(dim => ({
      key: dim.key,
      options: dim.options.map(o => ({
        ...o,
        count: events.filter(e => dim.get(e) === o.value).length,
      })),
    }))
    .filter(g => g.options.filter(o => o.count > 0).length > 1)
}

interface Props {
  events: EnrichedEvent[]
}

export default function EventsFilterableContent({ events }: Props) {
  const [filters, setFilters] = useState<FilterState>(() => {
    const countries = [...new Set(events.map(e => e.country).filter(Boolean))] as string[]
    return defaultFilters(countries)
  })

  const filterGroups = useMemo(() => computeFilterGroups(events), [events])
  const filtered     = useMemo(() => applyFilters(events, filters), [events, filters])
  const pins         = useMemo(
    () => filtered
      .filter(e => e.route.length > 0)
      .map(e => ({ lat: e.lat, lon: e.lon, color: e.color, label: e.shortName, city: e.city })),
    [filtered],
  )

  return (
    <>
      {/* Filter-Leiste */}
      <EventFilters
        groups={filterGroups}
        filters={filters}
        onChange={setFilters}
        totalVisible={filtered.length}
        totalAll={events.length}
      />

      {/* Timeline + Karte */}
      {events.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-4 mb-10 items-stretch">
          {/* Rennsaison-Timeline */}
          <div className="flex-1 bg-card border border-border rounded-2xl p-5 sm:p-8">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-5">Rennsaison 2026</p>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-0">
                {events.map((event, i) => {
                  const date = new Date(event.date)
                  const isVisible = filtered.includes(event)
                  return (
                    <div
                      key={event.id}
                      className={`flex items-start gap-4 ${i < events.length - 1 ? 'pb-6' : ''} transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-25'}`}
                    >
                      <div className="mt-1.5 w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-background z-10" style={{ backgroundColor: event.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold" style={{ color: event.color }}>
                            {date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                          </span>
                          {event.country && <span className="text-sm">{countryFlag(event.country)}</span>}
                          <span className="font-bold text-foreground text-sm">{event.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[
                            event.location,
                            event.distance_km
                              ? `${event.distance_km} km${event.elevation_m ? ` / ~${event.elevation_m.toLocaleString('de-DE')} Hm` : ''}`
                              : null,
                            event.startTime || null,
                          ].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Leaflet-Karte */}
          <div className="lg:w-[45%] flex-shrink-0 h-[300px] lg:h-auto">
            <OverviewMap pins={pins} />
          </div>
        </div>
      )}

      {/* Event Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg">Keine Events für diese Filterauswahl.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filtered.map(event => {
            const date = new Date(event.date)
            const daysUntil = Math.ceil((date.getTime() - Date.now()) / 86400000)
            const diff  = difficultyConfig[event.difficulty ?? 'hard']
            const modus = getEventModus(event)
            const mc    = modusConfig[modus] ?? modusConfig.gran_fondo

            return (
              <div key={event.id} className="relative overflow-hidden rounded-3xl border border-border bg-card" style={{ backgroundImage: `linear-gradient(to bottom right, ${event.color}20, ${event.color}08, transparent)` }}>
                {/* Hintergrund-KM-Zahl */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-[family-name:var(--font-bebas)] text-[120px] sm:text-[180px] md:text-[220px] leading-none text-white/[0.03] select-none pointer-events-none">
                  {event.distance_km}
                </div>

                <div className="relative p-5 sm:p-8 md:p-10">
                  {/* Top Row */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(event.participation === 'registered' || event.participation === 'completed') ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                          ✓ Dabei
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-muted-foreground/30 text-muted-foreground">
                          ⏳ Geplant
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${mc.color}`}>
                        {mc.label}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold border text-stone-400 border-stone-400/30 bg-stone-400/10">
                        {bikeTypeLabels[event.bikeType] ?? 'Rennrad'}
                      </span>
                      {event.country && (
                        <span className="text-sm">{countryFlag(event.country)} {countryName(event.country)}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        {daysUntil > 0 ? 'Countdown' : 'Heute!'}
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
                      <span>{date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      {event.startTime && <span>Start {event.startTime}</span>}
                      {event.location && <span>{event.location}</span>}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-black/20 backdrop-blur rounded-xl p-3 sm:p-4 text-center">
                      <p className="text-2xl sm:text-3xl font-bold" style={{ color: event.color }}>{event.distance_km}</p>
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
                          {[1, 2, 3, 4].map(n => (
                            <div key={n} className={`h-4 w-2.5 rounded-sm ${n <= diff.bars ? diff.color : 'bg-white/10'}`} />
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{diff.label}</p>
                      </div>
                    )}
                  </div>

                  {/* Beschreibung */}
                  {event.notes && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                      {event.notes}
                    </p>
                  )}

                  {/* Karte + Höhenprofil */}
                  {event.route.length > 0 ? (
                    <EventVisuals
                      route={event.route}
                      elevation={event.elevation}
                      color={event.color}
                      distance_km={event.distance_km ?? 300}
                    />
                  ) : null}

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5">
                    <p className="text-sm text-muted-foreground">
                      Siehst du mich auf der Strecke? Sag Hallo!
                    </p>
                    {event.url && (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
                      >
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
    </>
  )
}
