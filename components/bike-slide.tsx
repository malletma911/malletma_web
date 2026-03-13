'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { Weight, Diamond, Cog, Circle, Calendar, Zap, Heart, Trophy, Flame, Mountain, Gauge, Route, Timer } from 'lucide-react'
import type { Bike, BikeStravaStats } from '@/types'

const typeLabels: Record<string, string> = {
  road: 'Rennrad',
  gravel: 'Gravel',
  mtb: 'MTB',
  tt: 'Zeitfahren',
}

const materialLabels: Record<string, string> = {
  carbon: 'Carbon',
  aluminium: 'Aluminium',
  steel: 'Stahl',
  titanium: 'Titan',
}

function formatNumber(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 0 })
}

function isStatVisible(bike: Bike, key: string): boolean {
  if (!bike.strava_display) return true
  return bike.strava_display[key] !== false
}

// CountUp hook
function useCountUp(target: number, duration = 1.5, active = false): number {
  const [value, setValue] = useState(0)
  const hasRun = useRef(false)

  useEffect(() => {
    if (!active || hasRun.current) return
    hasRun.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [active, target, duration])

  return value
}

// Half-circle gauge SVG
function SpeedGauge({ speed, maxSpeed = 80, color }: { speed: number; maxSpeed?: number; color: string }) {
  const radius = 40
  const circumference = Math.PI * radius
  const ratio = Math.min(speed / maxSpeed, 1)
  const dashOffset = circumference * (1 - ratio)

  return (
    <svg viewBox="0 0 100 55" className="w-full max-w-[120px] mx-auto mt-2">
      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" strokeLinecap="round" />
      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  )
}

// Progress bar for elevation
function ElevationBar({ elevation, color, animate }: { elevation: number; color: string; animate: boolean }) {
  const ratio = Math.min(elevation / 50000, 1) * 100
  return (
    <div className="w-full h-1.5 rounded-full bg-white/[0.05] mt-3 overflow-hidden">
      <motion.div className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
        initial={{ width: 0 }}
        animate={animate ? { width: `${ratio}%` } : { width: 0 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}

// Relative date formatting
function relativeDate(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Heute'
  if (diffDays === 1) return 'Gestern'
  if (diffDays < 7) return `Vor ${diffDays} Tagen`
  if (diffDays < 14) return 'Vor einer Woche'
  if (diffDays < 30) return `Vor ${Math.floor(diffDays / 7)} Wochen`
  if (diffDays < 60) return 'Vor einem Monat'
  if (diffDays < 365) return `Vor ${Math.floor(diffDays / 30)} Monaten`
  return `Vor ${Math.floor(diffDays / 365)} Jahr${Math.floor(diffDays / 365) > 1 ? 'en' : ''}`
}

// Fun facts generator
function generateFunFacts(stats: BikeStravaStats): { text: string; icon: string }[] {
  const facts: { text: string; icon: string }[] = []
  const km = stats.total_distance_km
  const elev = stats.total_elevation_m
  const hours = stats.total_moving_time_s / 3600

  // Distance comparisons
  const earthCircumference = 40075
  if (km >= earthCircumference) {
    const times = Math.round(km / earthCircumference * 10) / 10
    facts.push({ text: `${times}x um die Erde gefahren`, icon: '🌍' })
  } else if (km >= 1000) {
    const distanceComparisons: [number, string][] = [
      [9288, 'Transsibirische Eisenbahn'],
      [5500, 'München → New York (Luftlinie)'],
      [3200, 'Nordkap → Sizilien'],
      [2300, 'München → Istanbul'],
      [1600, 'Tour de France'],
      [1000, 'München → Barcelona'],
    ]
    for (const [d, name] of distanceComparisons) {
      if (km >= d) {
        facts.push({ text: `Strecke ${name} geschafft`, icon: '🗺️' })
        break
      }
    }
  }

  // Elevation comparisons
  if (elev > 0) {
    const everests = Math.round(elev / 8849 * 10) / 10
    if (everests >= 1) {
      facts.push({ text: `${everests}x den Mount Everest erklommen`, icon: '🏔️' })
    } else if (elev >= 2000) {
      facts.push({ text: `${formatNumber(elev)} hm — höher als der Zugspitze (2.962m)`, icon: '⛰️' })
    }
  }

  // Time
  if (hours >= 24) {
    const days = Math.round(hours / 24 * 10) / 10
    facts.push({ text: `${days} Tage nonstop im Sattel`, icon: '⏱️' })
  }

  // Avg per ride
  if (stats.total_activities > 0 && km > 0) {
    const avgKm = Math.round(km / stats.total_activities)
    facts.push({ text: `Ø ${avgKm} km pro Fahrt`, icon: '📊' })
  }

  return facts.slice(0, 3)
}

// Bike personality tags
function getBikePersonality(stats: BikeStravaStats, allStats: Record<string, BikeStravaStats>): { label: string; icon: React.ReactNode; color: string }[] {
  const tags: { label: string; icon: React.ReactNode; color: string }[] = []

  const elevPerKm = stats.total_distance_km > 0 ? stats.total_elevation_m / stats.total_distance_km : 0
  if (elevPerKm > 15) tags.push({ label: 'Bergziege', icon: <Mountain className="w-3 h-3" />, color: '#22c55e' })

  if (stats.avg_speed_kmh && stats.avg_speed_kmh > 28) tags.push({ label: 'Speedster', icon: <Gauge className="w-3 h-3" />, color: '#f59e0b' })

  if (stats.avg_watts && stats.avg_watts > 180) tags.push({ label: 'Power Machine', icon: <Zap className="w-3 h-3" />, color: '#8b5cf6' })

  if (stats.avg_distance_km && stats.avg_distance_km > 60) tags.push({ label: 'Langstrecke', icon: <Route className="w-3 h-3" />, color: '#06b6d4' })

  if (stats.trainer_activities && stats.total_activities > 0 && stats.trainer_activities / stats.total_activities > 0.5) {
    tags.push({ label: 'Indoor-Krieger', icon: <Timer className="w-3 h-3" />, color: '#ec4899' })
  }

  if (stats.total_pr_count && stats.total_pr_count > 20) tags.push({ label: 'PR-Jäger', icon: <Trophy className="w-3 h-3" />, color: '#eab308' })

  // Comparison badges
  const allEntries = Object.entries(allStats).filter(([, s]) => s.total_activities > 0)
  if (allEntries.length > 1) {
    const mostKm = allEntries.reduce((a, b) => a[1].total_distance_km > b[1].total_distance_km ? a : b)
    if (mostKm[0] === stats.bike_id) tags.push({ label: 'Meiste km', icon: <Trophy className="w-3 h-3" />, color: '#f97316' })

    const mostActivities = allEntries.reduce((a, b) => a[1].total_activities > b[1].total_activities ? a : b)
    if (mostActivities[0] === stats.bike_id) tags.push({ label: 'Dauerbrenner', icon: <Flame className="w-3 h-3" />, color: '#ef4444' })

    const mostElev = allEntries.reduce((a, b) => a[1].total_elevation_m > b[1].total_elevation_m ? a : b)
    if (mostElev[0] === stats.bike_id && mostElev[0] !== mostKm[0]) {
      tags.push({ label: 'Klettermeister', icon: <Mountain className="w-3 h-3" />, color: '#10b981' })
    }
  }

  return tags.slice(0, 4)
}

const specIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Gewicht: Weight,
  Rahmen: Diamond,
  Schaltung: Cog,
  'Laufräder': Circle,
  Baujahr: Calendar,
}

// Orchestrated animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
}

interface BikeSlideProps {
  bike: Bike
  stats: BikeStravaStats | null
  allStats: Record<string, BikeStravaStats>
  animateOnMount?: boolean
}

export default function BikeSlide({ bike, stats, allStats, animateOnMount = false }: BikeSlideProps) {
  const bikeColor = bike.color || '#a1a1aa'
  const parentRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(parentRef, { once: true, amount: 0.15 })

  const shouldAnimate = animateOnMount || isInView

  const specs = [
    bike.weight_kg && { label: 'Gewicht', value: `${bike.weight_kg} kg` },
    bike.frame_material && { label: 'Rahmen', value: materialLabels[bike.frame_material] ?? bike.frame_material },
    bike.groupset && { label: 'Schaltung', value: bike.groupset },
    bike.wheels && { label: 'Laufräder', value: bike.wheels },
    bike.year && { label: 'Baujahr', value: String(bike.year) },
  ].filter(Boolean) as { label: string; value: string }[]

  const hasStats = stats && stats.total_activities > 0
  const personalityTags = hasStats ? getBikePersonality(stats, allStats) : []
  const funFacts = hasStats ? generateFunFacts(stats) : []

  // CountUp values
  const distanceCount = useCountUp(stats?.total_distance_km ?? 0, 1.5, shouldAnimate && hasStats === true)
  const elevationCount = useCountUp(stats?.total_elevation_m ?? 0, 1.5, shouldAnimate && hasStats === true)
  const activitiesCount = useCountUp(stats?.total_activities ?? 0, 1.2, shouldAnimate && hasStats === true)
  const speedCount = useCountUp(Math.round((stats?.max_speed_kmh ?? 0) * 10), 1.5, shouldAnimate && hasStats === true)
  const movingTimeCount = useCountUp(stats?.total_moving_time_s ? Math.floor(stats.total_moving_time_s / 3600) : 0, 1.5, shouldAnimate && hasStats === true)

  // Animation props: desktop = animate immediately, mobile = whileInView
  const orchestrationProps = animateOnMount
    ? { initial: 'hidden' as const, animate: 'visible' as const }
    : { initial: 'hidden' as const, whileInView: 'visible' as const, viewport: { once: true, amount: 0.15 } }

  return (
    <div className="w-full flex-shrink-0 snap-start">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <motion.div
          className="relative rounded-3xl overflow-hidden mb-4 sm:mb-8"
          style={{
            background: [
              `radial-gradient(ellipse at 15% 25%, ${bikeColor}18 0%, transparent 55%)`,
              `radial-gradient(ellipse at 85% 65%, ${bikeColor}12 0%, transparent 50%)`,
              `radial-gradient(circle at 55% 15%, rgba(255,255,255,0.05) 0%, transparent 45%)`,
              `radial-gradient(ellipse at 40% 80%, ${bikeColor}0a 0%, transparent 50%)`,
            ].join(', '),
          }}
          {...(animateOnMount ? {
            initial: { opacity: 0, scale: 0.97 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
          } : {})}
        >
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/8] flex items-center justify-center py-4 sm:py-12">
            {bike.photo_url ? (
              <div
                className="relative w-full h-full mx-auto !max-w-[95%] sm:!max-w-[var(--bike-scale)]"
                style={{ '--bike-scale': `${bike.photo_scale ?? 80}%` } as React.CSSProperties}
              >
                <Image
                  src={bike.photo_url}
                  alt={bike.name}
                  fill
                  sizes="(max-width: 768px) 90vw, 70vw"
                  className="object-contain"
                  style={{
                    filter: [
                      `drop-shadow(0 0 30px ${bikeColor}40)`,
                      `drop-shadow(0 0 60px rgba(255,255,255,0.08))`,
                    ].join(' '),
                  }}
                  priority
                />
              </div>
            ) : (
              <div className="text-8xl opacity-20">&#x1F6B2;</div>
            )}
          </div>

          <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-6 sm:p-10 bg-gradient-to-t from-background/80 to-transparent">
            <div className="flex items-end justify-between gap-4">
              <div>
                {bike.type && (
                  <span
                    className="inline-block text-xs font-semibold px-3 py-1 rounded-full border mb-3"
                    style={{ backgroundColor: `${bikeColor}20`, borderColor: `${bikeColor}40`, color: bikeColor }}
                  >
                    {typeLabels[bike.type] ?? bike.type}
                  </span>
                )}
                <h2 className="font-[family-name:var(--font-bebas)] text-4xl sm:text-5xl md:text-7xl tracking-wider leading-none">
                  {bike.name}
                </h2>
                {(bike.brand || bike.model) && (
                  <p className="text-muted-foreground text-sm sm:text-base mt-1">
                    {[bike.brand, bike.model].filter(Boolean).join(' ')}
                  </p>
                )}
                {personalityTags.length > 0 && isStatVisible(bike, 'personality_tags') && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {personalityTags.map(tag => (
                      <span key={tag.label} className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
                        style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30`, color: tag.color }}>
                        {tag.icon} {tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile: Text unter dem Bild */}
        <div className="sm:hidden px-2 mb-6">
          {bike.type && (
            <span
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full border mb-3"
              style={{ backgroundColor: `${bikeColor}20`, borderColor: `${bikeColor}40`, color: bikeColor }}
            >
              {typeLabels[bike.type] ?? bike.type}
            </span>
          )}
          <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider leading-none">
            {bike.name}
          </h2>
          {(bike.brand || bike.model) && (
            <p className="text-muted-foreground text-sm mt-1">
              {[bike.brand, bike.model].filter(Boolean).join(' ')}
            </p>
          )}
          {personalityTags.length > 0 && isStatVisible(bike, 'personality_tags') && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {personalityTags.map(tag => (
                <span key={tag.label} className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
                  style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30`, color: tag.color }}>
                  {tag.icon} {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Orchestrated content sections */}
        <motion.div
          ref={parentRef}
          variants={containerVariants}
          {...orchestrationProps}
        >
          {/* Letzte Fahrt */}
          {hasStats && isStatVisible(bike, 'last_activity') && stats.last_activity_date && stats.last_activity_name && (
            <motion.div
              variants={itemVariants}
              className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03]"
            >
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: bikeColor }} />
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{relativeDate(stats.last_activity_date)}</span>
                {' — '}
                <span className="text-foreground">{stats.last_activity_name}</span>
              </p>
            </motion.div>
          )}

          {/* Bento Dashboard Stats */}
          {hasStats && (
            <motion.div variants={itemVariants} className="mb-8">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mb-4">Performance</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Distance — Hero Panel (2 cols) */}
                {isStatVisible(bike, 'total_distance') && (
                  <div
                    className="col-span-2 rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6"
                    style={{ borderTop: `2px solid ${bikeColor}`, boxShadow: `0 0 60px ${bikeColor}08` }}
                  >
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Gesamtstrecke</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-[family-name:var(--font-bebas)] text-4xl sm:text-5xl md:text-6xl tracking-wide leading-none">
                        {formatNumber(distanceCount)}
                      </span>
                      <span className="text-sm text-muted-foreground">km</span>
                    </div>
                    <div className="mt-4 h-1 rounded-full overflow-hidden bg-white/[0.03]">
                      <motion.div className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, transparent, ${bikeColor}80, ${bikeColor}, ${bikeColor}80, transparent)` }}
                        initial={{ width: 0 }}
                        animate={shouldAnimate ? { width: '100%' } : { width: 0 }}
                        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                )}

                {/* Elevation */}
                {isStatVisible(bike, 'total_elevation') && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6"
                    style={{ borderTop: `2px solid ${bikeColor}60` }}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Höhenmeter</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-wide leading-none">
                        {formatNumber(elevationCount)}
                      </span>
                      <span className="text-xs text-muted-foreground">hm</span>
                    </div>
                    <ElevationBar elevation={stats.total_elevation_m} color={bikeColor} animate={shouldAnimate} />
                  </div>
                )}

                {/* V-Max with Gauge */}
                {isStatVisible(bike, 'max_speed') && stats.max_speed_kmh && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6 flex flex-col items-center justify-between"
                    style={{ borderTop: `2px solid ${bikeColor}60` }}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 self-start">V-Max</p>
                    <SpeedGauge speed={stats.max_speed_kmh} color={bikeColor} />
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-[family-name:var(--font-bebas)] text-2xl sm:text-3xl tracking-wide leading-none">
                        {speedCount / 10}
                      </span>
                      <span className="text-xs text-muted-foreground">km/h</span>
                    </div>
                  </div>
                )}

                {/* Activities */}
                {isStatVisible(bike, 'total_activities') && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6 flex flex-col justify-between"
                    style={{ borderTop: `2px solid ${bikeColor}60` }}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Fahrten</p>
                    <span className="font-[family-name:var(--font-bebas)] text-4xl sm:text-5xl tracking-wide leading-none" style={{ color: bikeColor }}>
                      {activitiesCount}
                    </span>
                  </div>
                )}

                {/* Moving Time */}
                {isStatVisible(bike, 'moving_time') && stats.total_moving_time_s > 0 && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6"
                    style={{ borderTop: `2px solid ${bikeColor}60` }}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Fahrzeit</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-wide leading-none">
                        {movingTimeCount}
                      </span>
                      <span className="text-xs text-muted-foreground">Stunden</span>
                    </div>
                  </div>
                )}

                {/* Avg Speed */}
                {isStatVisible(bike, 'avg_speed') && stats.avg_speed_kmh && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6"
                    style={{ borderTop: `2px solid ${bikeColor}60` }}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Ø Geschwindigkeit</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-wide leading-none">
                        {stats.avg_speed_kmh}
                      </span>
                      <span className="text-xs text-muted-foreground">km/h</span>
                    </div>
                  </div>
                )}

                {/* Power — Ø Watt */}
                {isStatVisible(bike, 'avg_watts') && stats.avg_watts && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6"
                    style={{ borderTop: `2px solid #8b5cf660` }}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Ø Leistung</p>
                    <div className="flex items-baseline gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-wide leading-none">
                        {stats.avg_watts}
                      </span>
                      <span className="text-xs text-muted-foreground">Watt</span>
                    </div>
                  </div>
                )}

                {/* Max Watt */}
                {isStatVisible(bike, 'max_watts') && stats.max_watts && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6"
                    style={{ borderTop: `2px solid #a855f760` }}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Max Leistung</p>
                    <div className="flex items-baseline gap-2">
                      <Zap className="w-4 h-4 text-purple-300" />
                      <span className="font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-wide leading-none">
                        {stats.max_watts}
                      </span>
                      <span className="text-xs text-muted-foreground">Watt</span>
                    </div>
                  </div>
                )}

                {/* Heart Rate */}
                {isStatVisible(bike, 'avg_heartrate') && stats.avg_heartrate && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6"
                    style={{ borderTop: `2px solid #ef444460` }}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Ø Herzfrequenz</p>
                    <div className="flex items-baseline gap-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span className="font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-wide leading-none">
                        {stats.avg_heartrate}
                      </span>
                      <span className="text-xs text-muted-foreground">bpm</span>
                    </div>
                  </div>
                )}

                {/* Max Heart Rate */}
                {isStatVisible(bike, 'max_heartrate') && stats.max_heartrate && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6"
                    style={{ borderTop: `2px solid #f8717160` }}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Max Herzfrequenz</p>
                    <div className="flex items-baseline gap-2">
                      <Heart className="w-4 h-4 text-red-300" />
                      <span className="font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-wide leading-none">
                        {stats.max_heartrate}
                      </span>
                      <span className="text-xs text-muted-foreground">bpm</span>
                    </div>
                  </div>
                )}

                {/* PRs & Suffer Score */}
                {isStatVisible(bike, 'pr_suffer') && (stats.total_pr_count || stats.total_suffer_score) && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6"
                    style={{ borderTop: `2px solid #eab30860` }}>
                    {stats.total_pr_count ? (
                      <div className="mb-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Persönliche Rekorde</p>
                        <div className="flex items-baseline gap-2">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span className="font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-wide leading-none">
                            {stats.total_pr_count}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    {stats.total_suffer_score ? (
                      <div>
                        {stats.total_pr_count && <div className="border-t border-white/5 pt-3 mt-0" />}
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Suffer Score</p>
                        <div className="flex items-baseline gap-2">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <span className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide leading-none">
                            {formatNumber(stats.total_suffer_score)}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Longest Ride — full width */}
                {isStatVisible(bike, 'longest_ride') && stats.longest_ride_km && (
                  <div className="col-span-2 sm:col-span-3 rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6 flex items-center justify-between gap-4"
                    style={{ borderTop: `2px solid ${bikeColor}40` }}>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Längste Tour</p>
                      {stats.longest_ride_name && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{stats.longest_ride_name}</p>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 shrink-0">
                      <span className="font-[family-name:var(--font-bebas)] text-2xl sm:text-3xl tracking-wide leading-none">
                        {formatNumber(stats.longest_ride_km)}
                      </span>
                      <span className="text-xs text-muted-foreground">km</span>
                    </div>
                  </div>
                )}

                {/* Biggest Climb — full width */}
                {isStatVisible(bike, 'biggest_climb') && stats.biggest_climb_m && (
                  <div className="col-span-2 sm:col-span-3 rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6 flex items-center justify-between gap-4"
                    style={{ borderTop: `2px solid ${bikeColor}40` }}>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Größter Anstieg</p>
                      {stats.biggest_climb_name && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{stats.biggest_climb_name}</p>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 shrink-0">
                      <span className="font-[family-name:var(--font-bebas)] text-2xl sm:text-3xl tracking-wide leading-none">
                        {formatNumber(stats.biggest_climb_m)}
                      </span>
                      <span className="text-xs text-muted-foreground">hm</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Specs — Chip Strip */}
          {specs.length > 0 && (
            <motion.div variants={itemVariants} className="mb-8">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mb-4">Specs</p>
              <div className="flex flex-wrap gap-2">
                {specs.map(spec => {
                  const Icon = specIcons[spec.label]
                  return (
                    <div key={spec.label}
                      className="flex items-center gap-2 rounded-full px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] transition-colors">
                      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className="text-sm text-foreground">{spec.value}</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Fun Facts */}
          {isStatVisible(bike, 'fun_facts') && funFacts.length > 0 && (
            <motion.div variants={itemVariants} className="mb-8">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mb-4">Wusstest du?</p>
              <div className="space-y-2">
                {funFacts.map((fact, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03]">
                    <span className="text-lg">{fact.icon}</span>
                    <p className="text-sm text-foreground">{fact.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Description */}
          {bike.description && (
            <motion.div variants={itemVariants} className="mb-12">
              <div className="pl-4 border-l-2 max-w-3xl" style={{ borderColor: `${bikeColor}40` }}>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  {bike.description}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
