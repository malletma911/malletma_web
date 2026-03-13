'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface ContributionGridProps {
  activities: { start_date: string; distance_km: number }[]
  color?: string
}

export default function ContributionGrid({ activities, color = '#22c55e' }: ContributionGridProps) {
  const { weeks, maxKm, monthLabels } = useMemo(() => {
    // Build map of date → total km
    const dayMap = new Map<string, number>()
    for (const a of activities) {
      const d = a.start_date.split('T')[0]
      dayMap.set(d, (dayMap.get(d) ?? 0) + a.distance_km)
    }

    // Generate 52 weeks (364 days) ending today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDay = new Date(today)
    startDay.setDate(startDay.getDate() - 363) // 364 days total

    // Align to Sunday
    const dayOfWeek = startDay.getDay()
    startDay.setDate(startDay.getDate() - dayOfWeek)

    const weeks: { date: string; km: number }[][] = []
    let currentWeek: { date: string; km: number }[] = []
    let maxKm = 0

    const d = new Date(startDay)
    while (d <= today) {
      const ds = d.toISOString().split('T')[0]
      const km = dayMap.get(ds) ?? 0
      if (km > maxKm) maxKm = km
      currentWeek.push({ date: ds, km })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      d.setDate(d.getDate() + 1)
    }
    if (currentWeek.length > 0) weeks.push(currentWeek)

    // Month labels
    const monthLabels: { label: string; col: number }[] = []
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    let lastMonth = -1
    for (let w = 0; w < weeks.length; w++) {
      const firstDay = new Date(weeks[w][0].date)
      const m = firstDay.getMonth()
      if (m !== lastMonth) {
        monthLabels.push({ label: months[m], col: w })
        lastMonth = m
      }
    }

    return { weeks, maxKm, monthLabels }
  }, [activities])

  const getOpacity = (km: number) => {
    if (km === 0) return 0
    if (maxKm === 0) return 0
    const ratio = km / maxKm
    if (ratio < 0.25) return 0.25
    if (ratio < 0.5) return 0.5
    if (ratio < 0.75) return 0.75
    return 1
  }

  const cellSize = 12
  const gap = 2
  const dayLabels = ['', 'Mo', '', 'Mi', '', 'Fr', '']

  return (
    <div className="overflow-x-auto">
      {/* Month labels */}
      <div className="flex mb-1" style={{ paddingLeft: 28 }}>
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="text-[10px] text-muted-foreground"
            style={{
              position: 'relative',
              left: m.col * (cellSize + gap),
              width: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col justify-between mr-1" style={{ height: 7 * (cellSize + gap) - gap }}>
          {dayLabels.map((label, i) => (
            <span key={i} className="text-[9px] text-muted-foreground leading-none" style={{ height: cellSize }}>
              {label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-0.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (wi * 7 + di) * 0.001, duration: 0.3 }}
                  className="rounded-[3px] transition-colors"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: day.km > 0
                      ? `color-mix(in srgb, ${color} ${getOpacity(day.km) * 100}%, transparent)`
                      : 'rgba(255,255,255,0.05)',
                  }}
                  title={`${day.date}: ${day.km > 0 ? `${Math.round(day.km)} km` : 'Kein Training'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground mr-1">Weniger</span>
        {[0, 0.25, 0.5, 0.75, 1].map((opacity, i) => (
          <div
            key={i}
            className="rounded-[3px]"
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: opacity === 0
                ? 'rgba(255,255,255,0.05)'
                : `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`,
            }}
          />
        ))}
        <span className="text-[10px] text-muted-foreground ml-1">Mehr</span>
      </div>
    </div>
  )
}
