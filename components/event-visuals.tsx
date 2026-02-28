'use client'

import dynamic from 'next/dynamic'

const RouteMap = dynamic(() => import('./route-map'), { ssr: false })
const ElevationChart = dynamic(() => import('./elevation-chart'), { ssr: false })

interface Props {
  route: [number, number][]
  elevation: { d: number; e: number }[]
  color: string
  notes?: string | null
  distance_km: number
}

export default function EventVisuals({ route, elevation, color, notes, distance_km }: Props) {
  const center: [number, number] = route[Math.floor(route.length / 2)]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Karte */}
      <div className="bg-black/20 rounded-2xl overflow-hidden" style={{ height: 240 }}>
        <RouteMap route={route} color={color} center={center} zoom={9} />
      </div>
      {/* Höhenprofil */}
      <div className="bg-black/20 rounded-2xl p-4 flex flex-col justify-center" style={{ height: 240 }}>
        <ElevationChart data={elevation} color={color} totalKm={distance_km} />
        {notes && (
          <p className="text-muted-foreground text-xs mt-4 leading-relaxed line-clamp-3">
            {notes}
          </p>
        )}
      </div>
    </div>
  )
}
