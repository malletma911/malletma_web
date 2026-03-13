'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

interface Activity {
  start_date: string
  distance_km: number
  elevation_m: number
  moving_time_s: number
  avg_speed_kmh: number | null
  avg_watts: number | null
  avg_heartrate: number | null
  trainer: boolean
}

// --- Monthly Distance Chart ---
export function MonthlyChart({ activities }: { activities: Activity[] }) {
  const data = useMemo(() => {
    const months = new Map<string, { km: number; hm: number; count: number }>()
    const now = new Date()

    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.set(key, { km: 0, hm: 0, count: 0 })
    }

    for (const a of activities) {
      const key = a.start_date.substring(0, 7)
      const entry = months.get(key)
      if (entry) {
        entry.km += a.distance_km
        entry.hm += a.elevation_m
        entry.count++
      }
    }

    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    return [...months.entries()].map(([key, v]) => ({
      month: monthNames[parseInt(key.split('-')[1]) - 1],
      km: Math.round(v.km),
      hm: Math.round(v.hm),
      fahrten: v.count,
    }))
  }, [activities])

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
        <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
          labelStyle={{ color: '#fff' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            name === 'km' ? `${value} km` : name === 'hm' ? `${value} hm` : value,
            name === 'km' ? 'Distanz' : name === 'hm' ? 'Höhenmeter' : 'Fahrten',
          ]}
        />
        <Bar dataKey="km" fill="#f97316" radius={[4, 4, 0, 0]} />
        <Bar dataKey="hm" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.6} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// --- Yearly Comparison ---
export function YearlyComparison({ activities }: { activities: Activity[] }) {
  const data = useMemo(() => {
    const years = new Map<number, { km: number; hm: number; rides: number }>()
    for (const a of activities) {
      const y = new Date(a.start_date).getFullYear()
      const entry = years.get(y) ?? { km: 0, hm: 0, rides: 0 }
      entry.km += a.distance_km
      entry.hm += a.elevation_m
      entry.rides++
      years.set(y, entry)
    }

    return [...years.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, v], i, arr) => {
        const prev = i > 0 ? arr[i - 1][1].km : null
        const change = prev ? Math.round((v.km - prev) / prev * 100) : null
        return {
          year: String(year),
          km: Math.round(v.km),
          hm: Math.round(v.hm),
          rides: v.rides,
          change,
        }
      })
  }, [activities])

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="year" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
        <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
          labelStyle={{ color: '#fff' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            name === 'km' ? `${Number(value).toLocaleString('de-DE')} km` : `${Number(value).toLocaleString('de-DE')} hm`,
            name === 'km' ? 'Distanz' : 'Höhenmeter',
          ]}
        />
        <Bar dataKey="km" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// --- Weekday Distribution ---
export function WeekdayDistribution({ activities }: { activities: Activity[] }) {
  const data = useMemo(() => {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    const counts = new Array(7).fill(0)
    for (const a of activities) {
      const dow = new Date(a.start_date).getDay()
      counts[dow]++
    }
    // Reorder to start with Monday
    return [1, 2, 3, 4, 5, 6, 0].map(i => ({
      day: days[i],
      fahrten: counts[i],
    }))
  }, [activities])

  const maxCount = Math.max(...data.map(d => d.fahrten))

  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.day} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-6">{d.day}</span>
          <div className="flex-1 h-5 bg-white/[0.03] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
              style={{ width: maxCount > 0 ? `${(d.fahrten / maxCount) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-xs tabular-nums text-foreground w-8 text-right">{d.fahrten}</span>
        </div>
      ))}
    </div>
  )
}

// --- Time of Day Distribution ---
export function TimeOfDayChart({ activities }: { activities: Activity[] }) {
  const data = useMemo(() => {
    const slots = [
      { name: 'Morgens', range: '5–10 Uhr', count: 0, color: '#fbbf24' },
      { name: 'Vormittag', range: '10–12 Uhr', count: 0, color: '#f97316' },
      { name: 'Mittags', range: '12–14 Uhr', count: 0, color: '#ef4444' },
      { name: 'Nachmittag', range: '14–17 Uhr', count: 0, color: '#8b5cf6' },
      { name: 'Abends', range: '17–21 Uhr', count: 0, color: '#3b82f6' },
      { name: 'Nachts', range: '21–5 Uhr', count: 0, color: '#1e3a5f' },
    ]

    for (const a of activities) {
      const h = new Date(a.start_date).getHours()
      if (h >= 5 && h < 10) slots[0].count++
      else if (h >= 10 && h < 12) slots[1].count++
      else if (h >= 12 && h < 14) slots[2].count++
      else if (h >= 14 && h < 17) slots[3].count++
      else if (h >= 17 && h < 21) slots[4].count++
      else slots[5].count++
    }

    return slots.filter(s => s.count > 0)
  }, [activities])

  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="flex items-center gap-6">
      <div className="w-36 h-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              innerRadius="60%"
              outerRadius="95%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 flex-1">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="text-muted-foreground/50">{d.range}</span>
            <span className="ml-auto tabular-nums text-foreground">{d.count}</span>
            <span className="text-muted-foreground/50 tabular-nums w-10 text-right">
              {total > 0 ? Math.round(d.count / total * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Heart Rate Zones ---
export function HeartRateZones({ activities }: { activities: Activity[] }) {
  const zones = useMemo(() => {
    const z = [
      { name: 'Recovery', range: '< 120', min: 0, max: 120, count: 0, color: '#22c55e' },
      { name: 'Aerob', range: '120–150', min: 120, max: 150, count: 0, color: '#3b82f6' },
      { name: 'Tempo', range: '150–170', min: 150, max: 170, count: 0, color: '#f97316' },
      { name: 'Threshold', range: '170–185', min: 170, max: 185, count: 0, color: '#ef4444' },
      { name: 'Max', range: '> 185', min: 185, max: 999, count: 0, color: '#dc2626' },
    ]

    for (const a of activities) {
      if (!a.avg_heartrate) continue
      const hr = a.avg_heartrate
      for (const zone of z) {
        if (hr >= zone.min && hr < zone.max) {
          zone.count++
          break
        }
      }
    }

    return z
  }, [activities])

  const total = zones.reduce((s, z) => s + z.count, 0)

  return (
    <div className="space-y-3">
      {zones.map(z => (
        <div key={z.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />
              <span className="text-foreground">{z.name}</span>
              <span className="text-muted-foreground/50">{z.range} bpm</span>
            </div>
            <span className="tabular-nums text-muted-foreground">
              {z.count} ({total > 0 ? Math.round(z.count / total * 100) : 0}%)
            </span>
          </div>
          <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: total > 0 ? `${(z.count / total) * 100}%` : '0%',
                backgroundColor: z.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Power Trend ---
export function PowerTrend({ activities }: { activities: Activity[] }) {
  const data = useMemo(() => {
    const months = new Map<string, { totalW: number; count: number }>()

    for (const a of activities) {
      if (!a.avg_watts || a.avg_watts <= 0) continue
      const key = a.start_date.substring(0, 7)
      const entry = months.get(key) ?? { totalW: 0, count: 0 }
      entry.totalW += a.avg_watts
      entry.count++
      months.set(key, entry)
    }

    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    return [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, v]) => ({
        month: monthNames[parseInt(key.split('-')[1]) - 1],
        watt: Math.round(v.totalW / v.count),
      }))
  }, [activities])

  if (data.length < 2) return <p className="text-sm text-muted-foreground">Nicht genug Leistungsdaten</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
        <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${value} W`, 'Ø Leistung']}
        />
        <Line type="monotone" dataKey="watt" stroke="#eab308" strokeWidth={2} dot={{ r: 3, fill: '#eab308' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// --- Speed Trend ---
export function SpeedTrend({ activities }: { activities: Activity[] }) {
  const data = useMemo(() => {
    const months = new Map<string, { totalSpd: number; count: number }>()

    for (const a of activities) {
      if (!a.avg_speed_kmh || a.avg_speed_kmh <= 0 || a.trainer) continue
      const key = a.start_date.substring(0, 7)
      const entry = months.get(key) ?? { totalSpd: 0, count: 0 }
      entry.totalSpd += a.avg_speed_kmh
      entry.count++
      months.set(key, entry)
    }

    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    return [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, v]) => ({
        month: monthNames[parseInt(key.split('-')[1]) - 1],
        speed: Math.round(v.totalSpd / v.count * 10) / 10,
      }))
  }, [activities])

  if (data.length < 2) return <p className="text-sm text-muted-foreground">Nicht genug Geschwindigkeitsdaten</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
        <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${value} km/h`, 'Ø Speed']}
        />
        <Line type="monotone" dataKey="speed" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: '#06b6d4' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// --- Elevation Profile (Monthly) ---
export function ElevationChart({ activities }: { activities: Activity[] }) {
  const data = useMemo(() => {
    const months = new Map<string, number>()
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.set(key, 0)
    }

    for (const a of activities) {
      const key = a.start_date.substring(0, 7)
      if (months.has(key)) {
        months.set(key, (months.get(key) ?? 0) + a.elevation_m)
      }
    }

    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    return [...months.entries()].map(([key, hm]) => ({
      month: monthNames[parseInt(key.split('-')[1]) - 1],
      hm: Math.round(hm),
    }))
  }, [activities])

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
        <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${Number(value).toLocaleString('de-DE')} hm`, 'Höhenmeter']}
        />
        <Bar dataKey="hm" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// --- Activity Types Donut ---
export function ActivityTypes({ activities }: { activities: Activity[] }) {
  const data = useMemo(() => {
    const outdoor = activities.filter(a => !a.trainer).length
    const indoor = activities.filter(a => a.trainer).length

    const types: { name: string; value: number; color: string }[] = []
    if (outdoor > 0) types.push({ name: 'Outdoor', value: outdoor, color: '#f97316' })
    if (indoor > 0) types.push({ name: 'Indoor/Trainer', value: indoor, color: '#8b5cf6' })
    return types
  }, [activities])

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex items-center gap-6">
      <div className="w-32 h-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="55%"
              outerRadius="95%"
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-foreground">{d.name}</span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {d.value} ({total > 0 ? Math.round(d.value / total * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
