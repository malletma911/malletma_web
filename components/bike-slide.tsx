'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
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

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  return `${formatNumber(hours)} h`
}

interface BikeSlideProps {
  bike: Bike
  stats: BikeStravaStats | null
}

export default function BikeSlide({ bike, stats }: BikeSlideProps) {
  const bikeColor = bike.color || '#a1a1aa'

  const specs = [
    bike.weight_kg && { label: 'Gewicht', value: `${bike.weight_kg} kg` },
    bike.frame_material && { label: 'Rahmen', value: materialLabels[bike.frame_material] ?? bike.frame_material },
    bike.groupset && { label: 'Schaltung', value: bike.groupset },
    bike.wheels && { label: 'Laufräder', value: bike.wheels },
    bike.year && { label: 'Baujahr', value: String(bike.year) },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="w-full flex-shrink-0 snap-start">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <div
          className="relative rounded-3xl overflow-hidden mb-8"
          style={{
            background: `radial-gradient(ellipse at center, ${bikeColor}15 0%, transparent 70%)`,
          }}
        >
          {/* Bike Image */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/8] flex items-center justify-center py-8 sm:py-12">
            {bike.photo_url ? (
              <div className="relative w-full h-full max-w-[80%] mx-auto">
                <Image
                  src={bike.photo_url}
                  alt={bike.name}
                  fill
                  sizes="(max-width: 768px) 90vw, 70vw"
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            ) : (
              <div className="text-8xl opacity-20">&#x1F6B2;</div>
            )}
          </div>

          {/* Bike Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 bg-gradient-to-t from-background/80 to-transparent">
            <div className="flex items-end justify-between gap-4">
              <div>
                {bike.type && (
                  <span
                    className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 border"
                    style={{
                      backgroundColor: `${bikeColor}20`,
                      borderColor: `${bikeColor}40`,
                      color: bikeColor,
                    }}
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
              </div>
            </div>
          </div>
        </div>

        {/* Strava Stats */}
        {stats && stats.total_activities > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mb-4">Strava Stats</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                value={`${formatNumber(stats.total_distance_km)} km`}
                label="Gesamtstrecke"
              />
              <StatCard
                value={`${formatNumber(stats.total_elevation_m)} hm`}
                label="Höhenmeter"
              />
              <StatCard
                value={String(stats.total_activities)}
                label="Aktivitäten"
              />
              <StatCard
                value={stats.max_speed_kmh ? `${stats.max_speed_kmh} km/h` : '–'}
                label="V-Max"
              />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {stats.longest_ride_km && (
                <StatCard
                  value={`${formatNumber(stats.longest_ride_km)} km`}
                  label={`Längste Tour${stats.longest_ride_name ? ` — ${stats.longest_ride_name}` : ''}`}
                />
              )}
              {stats.biggest_climb_m && (
                <StatCard
                  value={`${formatNumber(stats.biggest_climb_m)} hm`}
                  label={`Größter Anstieg${stats.biggest_climb_name ? ` — ${stats.biggest_climb_name}` : ''}`}
                />
              )}
              {stats.total_moving_time_s > 0 && (
                <StatCard
                  value={formatDuration(stats.total_moving_time_s)}
                  label="Fahrzeit gesamt"
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Specs */}
        {specs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mb-4">Specs</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {specs.map(spec => (
                <div
                  key={spec.label}
                  className="px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03]"
                >
                  <p className="text-sm font-medium text-foreground">{spec.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{spec.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Description */}
        {bike.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl">
              {bike.description}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03]">
      <p className="text-base font-bold tabular-nums leading-none text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5 line-clamp-1">{label}</p>
    </div>
  )
}
