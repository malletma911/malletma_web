'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { d: number; e: number }[]
  color: string
  totalKm: number
}

export default function ElevationChart({ data, color, totalKm }: Props) {
  const minE = Math.min(...data.map(d => d.e))
  const maxE = Math.max(...data.map(d => d.e))

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
        <span>Höhenprofil</span>
        <span>{minE}m – {maxE}m</span>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="d"
            tickFormatter={v => `${v}km`}
            tick={{ fontSize: 10, fill: '#666' }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(data.length / 4)}
          />
          <YAxis hide domain={[minE - 10, maxE + 10]} />
          <Tooltip
            contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 12 }}
            formatter={(val: number | undefined) => [`${val ?? 0}m`, 'Höhe']}
            labelFormatter={(label) => `${label} km`}
          />
          <Area
            type="monotone"
            dataKey="e"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${color.replace('#','')})`}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
