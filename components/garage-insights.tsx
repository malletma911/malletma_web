'use client'

import { motion } from 'framer-motion'
import { ThumbsUp } from 'lucide-react'
import type { Bike, BikeStravaStats } from '@/types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

function formatNumber(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 0 })
}

interface BikeWithStats {
  bike: Bike
  stats: BikeStravaStats
}

interface GarageInsightsProps {
  bikes: Bike[]
  stats: Record<string, BikeStravaStats>
}

export default function GarageInsights({ bikes, stats }: GarageInsightsProps) {
  // Only bikes that have stats with activities
  const bikesWithStats: BikeWithStats[] = bikes
    .map(bike => ({ bike, stats: stats[bike.id] }))
    .filter((b): b is BikeWithStats => b.stats != null && b.stats.total_activities > 0)

  if (bikesWithStats.length === 0) return null

  const hasIndoor = bikesWithStats.some(b => (b.stats.trainer_activities ?? 0) > 0)
  const hasKudos = bikesWithStats.some(b => (b.stats.total_kudos ?? 0) > 0)
  const totalKj = bikesWithStats.reduce((sum, b) => sum + Number(b.stats.total_kilojoules || 0), 0)

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 sm:px-6 mt-16"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      <motion.div variants={itemVariants}>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mb-6">Vergleich</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bike-Vergleichsbalken */}
        <ComparisonBars bikesWithStats={bikesWithStats} />

        {/* Timeline */}
        <BikeTimeline bikesWithStats={bikesWithStats} />

        {/* Indoor vs Outdoor */}
        {hasIndoor && <IndoorOutdoor bikesWithStats={bikesWithStats} />}

        {/* Energie-Output */}
        {totalKj > 0 && <EnergyOutput totalKj={totalKj} />}

        {/* Kudos-Leaderboard */}
        {hasKudos && <KudosLeaderboard bikesWithStats={bikesWithStats} />}
      </div>
    </motion.div>
  )
}

// ---------------------
// Comparison Bars
// ---------------------

const categories = [
  { key: 'km', label: 'Kilometer', getValue: (s: BikeStravaStats) => s.total_distance_km, unit: 'km' },
  { key: 'elev', label: 'Höhenmeter', getValue: (s: BikeStravaStats) => s.total_elevation_m, unit: 'hm' },
  { key: 'rides', label: 'Fahrten', getValue: (s: BikeStravaStats) => s.total_activities, unit: '' },
  { key: 'speed', label: 'Ø Speed', getValue: (s: BikeStravaStats) => s.avg_speed_kmh ?? 0, unit: 'km/h' },
] as const

function ComparisonBars({ bikesWithStats }: { bikesWithStats: BikeWithStats[] }) {
  if (bikesWithStats.length < 2) return null

  return (
    <motion.div variants={itemVariants} className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6 lg:col-span-2">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-5">Bike-Vergleich</p>
      <div className="space-y-6">
        {categories.map(cat => {
          const values = bikesWithStats.map(b => ({ ...b, value: cat.getValue(b.stats) }))
          const max = Math.max(...values.map(v => v.value))
          if (max === 0) return null

          return (
            <div key={cat.key}>
              <p className="text-xs text-muted-foreground mb-2">{cat.label}</p>
              <div className="space-y-1.5">
                {values.map(({ bike, value }) => {
                  const color = bike.color || '#a1a1aa'
                  const ratio = max > 0 ? (value / max) * 100 : 0
                  return (
                    <div key={bike.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20 truncate shrink-0">{bike.name}</span>
                      <div className="flex-1 h-5 rounded-full bg-white/[0.03] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: `${color}cc` }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${ratio}%` }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          viewport={{ once: true }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-foreground w-20 text-right shrink-0">
                        {cat.key === 'speed' ? value.toFixed(1) : formatNumber(value)} {cat.unit}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ---------------------
// Timeline
// ---------------------

function BikeTimeline({ bikesWithStats }: { bikesWithStats: BikeWithStats[] }) {
  const withDates = bikesWithStats
    .filter(b => b.stats.first_activity_date)
    .sort((a, b) => new Date(a.stats.first_activity_date!).getTime() - new Date(b.stats.first_activity_date!).getTime())

  if (withDates.length === 0) return null

  const earliest = new Date(withDates[0].stats.first_activity_date!).getTime()
  const now = Date.now()
  const totalSpan = now - earliest

  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`
  }

  return (
    <motion.div variants={itemVariants} className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-5">Timeline</p>
      <div className="space-y-3">
        {withDates.map(({ bike, stats: s }) => {
          const color = bike.color || '#a1a1aa'
          const start = new Date(s.first_activity_date!).getTime()
          const end = s.last_activity_date ? new Date(s.last_activity_date).getTime() : now
          const left = totalSpan > 0 ? ((start - earliest) / totalSpan) * 100 : 0
          const width = totalSpan > 0 ? ((end - start) / totalSpan) * 100 : 100

          return (
            <div key={bike.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground">{bike.name}</span>
                <span className="text-[10px] text-muted-foreground">seit {formatDate(s.first_activity_date!)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.03] overflow-hidden relative">
                <motion.div
                  className="absolute h-full rounded-full"
                  style={{
                    left: `${left}%`,
                    backgroundColor: color,
                  }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${width}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ---------------------
// Indoor vs Outdoor
// ---------------------

function IndoorOutdoor({ bikesWithStats }: { bikesWithStats: BikeWithStats[] }) {
  const relevant = bikesWithStats.filter(b => b.stats.total_activities > 0)
  if (relevant.length === 0) return null

  return (
    <motion.div variants={itemVariants} className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-5">Indoor vs. Outdoor</p>
      <div className="space-y-3">
        {relevant.map(({ bike, stats: s }) => {
          const color = bike.color || '#a1a1aa'
          const indoor = s.trainer_activities ?? 0
          const total = s.total_activities
          const outdoorPct = total > 0 ? Math.round(((total - indoor) / total) * 100) : 100
          const indoorPct = 100 - outdoorPct

          return (
            <div key={bike.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground">{bike.name}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {outdoorPct}% Outdoor{indoor > 0 ? ` · ${indoorPct}% Indoor` : ''}
                </span>
              </div>
              <div className="h-3 rounded-full bg-white/[0.03] overflow-hidden flex">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${outdoorPct}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                />
                {indoor > 0 && (
                  <motion.div
                    className="h-full bg-purple-500/60"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${indoorPct}%` }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ---------------------
// Energy Output
// ---------------------

function EnergyOutput({ totalKj }: { totalKj: number }) {
  const equivalents = [
    { icon: '🍕', name: 'Pizzen', kj: 3350 },
    { icon: '🍫', name: 'Tafeln Schokolade', kj: 2250 },
    { icon: '🍺', name: 'Bier (0,5L)', kj: 900 },
  ]

  return (
    <motion.div variants={itemVariants} className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Energie-Output</p>
      <p className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide leading-none mb-4">
        {formatNumber(totalKj)} <span className="text-base text-muted-foreground">kJ</span>
      </p>
      <div className="space-y-2">
        {equivalents.map(eq => {
          const count = Math.round(totalKj / eq.kj)
          if (count < 1) return null
          return (
            <div key={eq.name} className="flex items-center gap-3">
              <span className="text-lg">{eq.icon}</span>
              <p className="text-sm text-muted-foreground">
                Entspricht <span className="text-foreground font-medium">{formatNumber(count)}</span> {eq.name}
              </p>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ---------------------
// Kudos Leaderboard
// ---------------------

function KudosLeaderboard({ bikesWithStats }: { bikesWithStats: BikeWithStats[] }) {
  const sorted = [...bikesWithStats]
    .filter(b => (b.stats.total_kudos ?? 0) > 0)
    .sort((a, b) => (b.stats.total_kudos ?? 0) - (a.stats.total_kudos ?? 0))

  if (sorted.length === 0) return null

  const max = sorted[0].stats.total_kudos ?? 0

  return (
    <motion.div variants={itemVariants} className="rounded-xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-5">Kudos-Ranking</p>
      <div className="space-y-3">
        {sorted.map(({ bike, stats: s }, i) => {
          const color = bike.color || '#a1a1aa'
          const kudos = s.total_kudos ?? 0
          const ratio = max > 0 ? (kudos / max) * 100 : 0

          return (
            <div key={bike.id} className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground w-5 shrink-0">{i + 1}.</span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-foreground w-20 truncate shrink-0">{bike.name}</span>
              <div className="flex-1 h-4 rounded-full bg-white/[0.03] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: `${color}80` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${ratio}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ThumbsUp className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs tabular-nums text-foreground">{formatNumber(kudos)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
