'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { AthleteStats, StoredActivity, StatsDisplay } from '@/types'
import {
  MonthlyChart, YearlyComparison, WeekdayDistribution, TimeOfDayChart,
  HeartRateZones, PowerTrend, SpeedTrend, ElevationChart, ActivityTypes,
} from './stats-charts'
import ContributionGrid from './contribution-grid'

const StatsHeatmap = dynamic(() => import('./stats-heatmap'), { ssr: false })

interface StatsShowcaseProps {
  stats: AthleteStats
  activities: StoredActivity[]
  display: StatsDisplay
}

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const }}
      className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 sm:p-6"
    >
      <h3 className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-foreground mb-4">{title}</h3>
      {children}
    </motion.div>
  )
}

function StatCard({ value, label, unit }: { value: string | number; label: string; unit?: string }) {
  return (
    <div className="text-center">
      <p className="font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-wider text-foreground">
        {value}
        {unit && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function RecordItem({ value, unit, label, name }: { value: string | number; unit: string; label: string; name?: string | null }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
      <p className="font-[family-name:var(--font-bebas)] text-2xl sm:text-3xl tracking-wider text-foreground">
        {value} <span className="text-sm text-muted-foreground">{unit}</span>
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {name && <p className="text-[10px] text-primary mt-0.5 truncate">{name}</p>}
    </div>
  )
}

export default function StatsShowcase({ stats, activities, display }: StatsShowcaseProps) {
  const activitiesForCharts = activities.map(a => ({
    start_date: a.start_date,
    distance_km: a.distance_km,
    elevation_m: a.elevation_m,
    moving_time_s: a.moving_time_s,
    avg_speed_kmh: a.avg_speed_kmh,
    avg_watts: a.avg_watts,
    avg_heartrate: a.avg_heartrate,
    trainer: a.trainer,
  }))

  const polylines = activities
    .map(a => a.summary_polyline)
    .filter((p): p is string => !!p)

  const totalTimeH = Math.round(stats.total_moving_time_s / 3600)
  const totalTimeDays = Math.round(stats.total_moving_time_s / 3600 / 24 * 10) / 10

  // Everesting: 8849m
  const everestings = stats.total_elevation_m > 0 ? (stats.total_elevation_m / 8849) : 0

  // Energy equivalents
  const pizzas = stats.total_kilojoules ? Math.floor(stats.total_kilojoules / 3350) : 0
  const chocolates = stats.total_kilojoules ? Math.floor(stats.total_kilojoules / 2250) : 0
  const beers = stats.total_kilojoules ? Math.floor(stats.total_kilojoules / 900) : 0

  const firstYear = stats.first_activity_date ? new Date(stats.first_activity_date).getFullYear() : null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
      {/* A. Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 py-6"
      >
        <StatCard
          value={stats.total_distance_km.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
          label="Kilometer"
          unit="km"
        />
        <StatCard
          value={stats.total_elevation_m.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
          label="Höhenmeter"
          unit="hm"
        />
        <StatCard
          value={totalTimeDays >= 1 ? String(totalTimeDays) : String(totalTimeH)}
          label="Im Sattel"
          unit={totalTimeDays >= 1 ? 'Tage' : 'h'}
        />
        <StatCard value={stats.total_activities} label="Fahrten" />
        {firstYear && (
          <StatCard value={`Seit ${firstYear}`} label="Aktiv" />
        )}
      </motion.div>

      {/* B. Heatmap */}
      {display.heatmap && polylines.length > 0 && (
        <Section title="MEINE ROUTEN">
          <div className="h-[350px] sm:h-[450px] rounded-xl overflow-hidden -mx-1">
            <StatsHeatmap polylines={polylines} />
          </div>
        </Section>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* C. Monthly Chart */}
        {display.monthly_chart && (
          <Section title="MONATLICHE DISTANZ">
            <MonthlyChart activities={activitiesForCharts} />
          </Section>
        )}

        {/* D. Yearly Comparison */}
        {display.yearly_comparison && (
          <Section title="JAHRESVERGLEICH" delay={0.1}>
            <YearlyComparison activities={activitiesForCharts} />
          </Section>
        )}

        {/* E. Weekday Distribution */}
        {display.weekday_distribution && (
          <Section title="WOCHENTAGSVERTEILUNG">
            <WeekdayDistribution activities={activitiesForCharts} />
          </Section>
        )}

        {/* F. Time of Day */}
        {display.time_of_day && (
          <Section title="TAGESZEIT" delay={0.1}>
            <TimeOfDayChart activities={activitiesForCharts} />
          </Section>
        )}
      </div>

      {/* G. Records */}
      {display.records && (
        <Section title="ALL-TIME REKORDE">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.max_speed_kmh && (
              <RecordItem value={stats.max_speed_kmh} unit="km/h" label="Top Speed" />
            )}
            {stats.longest_ride_km && (
              <RecordItem
                value={Math.round(stats.longest_ride_km)}
                unit="km"
                label="Längste Tour"
                name={stats.longest_ride_name}
              />
            )}
            {stats.biggest_climb_m && (
              <RecordItem
                value={stats.biggest_climb_m.toLocaleString('de-DE')}
                unit="hm"
                label="Größter Anstieg"
                name={stats.biggest_climb_name}
              />
            )}
            {display.power && stats.max_watts && (
              <RecordItem value={stats.max_watts} unit="W" label="Max Leistung" />
            )}
            {display.heart_rate && stats.max_heartrate && (
              <RecordItem value={stats.max_heartrate} unit="bpm" label="Max Puls" />
            )}
          </div>
        </Section>
      )}

      {/* Zone & Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* H. Heart Rate Zones */}
        {display.heart_rate && (
          <Section title="HERZFREQUENZ-ZONEN">
            <HeartRateZones activities={activitiesForCharts} />
          </Section>
        )}

        {/* I. Power */}
        {display.power && (
          <Section title="LEISTUNGSENTWICKLUNG" delay={0.1}>
            <PowerTrend activities={activitiesForCharts} />
          </Section>
        )}

        {/* J. Speed */}
        {display.speed && (
          <Section title="GESCHWINDIGKEITSTREND">
            <SpeedTrend activities={activitiesForCharts} />
          </Section>
        )}

        {/* K. Elevation Profile */}
        {display.elevation_profile && (
          <Section title="HÖHENMETER PRO MONAT" delay={0.1}>
            <ElevationChart activities={activitiesForCharts} />
            {everestings > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <p className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-foreground">
                  {everestings.toFixed(1)}x
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Mount Everest bestiegen</p>
              </div>
            )}
          </Section>
        )}
      </div>

      {/* L. Activity Types */}
      {display.activity_types && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="AKTIVITÄTSTYPEN">
            <ActivityTypes activities={activitiesForCharts} />
          </Section>

          {/* M. Streaks */}
          {display.streaks && (
            <Section title="STREAKS & KONSISTENZ" delay={0.1}>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <p className="font-[family-name:var(--font-bebas)] text-3xl tracking-wider text-foreground">
                    {stats.current_streak_days}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Aktuelle Serie</p>
                  <p className="text-[10px] text-muted-foreground/50">Tage</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <p className="font-[family-name:var(--font-bebas)] text-3xl tracking-wider text-foreground">
                    {stats.longest_streak_days}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Längste Serie</p>
                  <p className="text-[10px] text-muted-foreground/50">Tage</p>
                </div>
              </div>
              <ContributionGrid activities={activities} color="#f97316" />
            </Section>
          )}
        </div>
      )}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* N. Energy */}
        {display.energy && stats.total_kilojoules && stats.total_kilojoules > 0 && (
          <Section title="ENERGIE-OUTPUT">
            <div className="text-center mb-5">
              <p className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider text-foreground">
                {Math.round(stats.total_kilojoules).toLocaleString('de-DE')}
                <span className="text-lg text-muted-foreground ml-1">kJ</span>
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Gesamtenergie</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <p className="text-2xl">🍕</p>
                <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-foreground mt-1">{pizzas}</p>
                <p className="text-[9px] text-muted-foreground">Pizzen</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <p className="text-2xl">🍫</p>
                <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-foreground mt-1">{chocolates}</p>
                <p className="text-[9px] text-muted-foreground">Schokoladen</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <p className="text-2xl">🍺</p>
                <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-foreground mt-1">{beers}</p>
                <p className="text-[9px] text-muted-foreground">Bier</p>
              </div>
            </div>
          </Section>
        )}

        {/* O. Kudos & Social */}
        {display.kudos && (
          <Section title="SOCIAL" delay={0.1}>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <p className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-foreground">
                  {stats.total_kudos}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Kudos</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <p className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-foreground">
                  {stats.total_pr_count}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">PRs</p>
              </div>
              {display.suffer_score && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <p className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-foreground">
                    {stats.total_suffer_score}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Suffer Score</p>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>

      {/* P. Recent Activities */}
      {display.recent_activities && activities.length > 0 && (
        <Section title="LETZTE AKTIVITÄTEN">
          <div className="space-y-2">
            {activities.slice(0, 10).map(a => (
              <div
                key={a.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                  <span className="text-sm">{a.trainer ? '🏠' : '🚴'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(a.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-4 text-xs tabular-nums text-muted-foreground shrink-0">
                  <span>{a.distance_km.toFixed(1)} km</span>
                  <span className="hidden sm:inline">{a.elevation_m} hm</span>
                  <span className="hidden sm:inline">
                    {Math.floor(a.moving_time_s / 3600)}:{String(Math.floor((a.moving_time_s % 3600) / 60)).padStart(2, '0')} h
                  </span>
                  {a.avg_speed_kmh && <span className="hidden md:inline">{a.avg_speed_kmh} km/h</span>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Averages Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-8"
      >
        {stats.avg_distance_km && (
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
            <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-foreground">
              {stats.avg_distance_km} km
            </p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Ø Distanz</p>
          </div>
        )}
        {stats.avg_elevation_per_ride && (
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
            <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-foreground">
              {stats.avg_elevation_per_ride} hm
            </p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Ø Höhenmeter</p>
          </div>
        )}
        {display.speed && stats.avg_speed_kmh && (
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
            <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-foreground">
              {stats.avg_speed_kmh} km/h
            </p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Ø Speed</p>
          </div>
        )}
        {display.power && stats.avg_watts && (
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
            <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-foreground">
              {stats.avg_watts} W
            </p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Ø Watt</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
