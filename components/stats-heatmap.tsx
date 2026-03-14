'use client'

import { useEffect, useRef } from 'react'
import type L from 'leaflet'

interface StatsHeatmapProps {
  polylines: string[]
}

// Decode Google-encoded polyline to lat/lng pairs
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let b: number
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dlng

    points.push([lat / 1e5, lng / 1e5])
  }

  return points
}

export default function StatsHeatmap({ polylines }: StatsHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || polylines.length === 0) return

    import('leaflet').then(L => {
      if (!mapRef.current || mapInstanceRef.current) return

      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      }

      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false,
        dragging: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 16,
      }).addTo(map)

      const bounds = L.latLngBounds([])
      let hasValidBounds = false

      for (const encoded of polylines) {
        const coords = decodePolyline(encoded)
        if (coords.length < 2) continue

        // Skip polylines with unrealistic GPS jumps (> ~100km between consecutive points)
        const MAX_JUMP = 1.0 // degrees (~111km)
        let hasJump = false
        for (let i = 1; i < coords.length; i++) {
          const dlat = Math.abs(coords[i][0] - coords[i - 1][0])
          const dlng = Math.abs(coords[i][1] - coords[i - 1][1])
          if (dlat > MAX_JUMP || dlng > MAX_JUMP) { hasJump = true; break }
        }
        if (hasJump) continue

        const latLngs = coords.map(([lat, lng]) => L.latLng(lat, lng))
        latLngs.forEach(ll => bounds.extend(ll))
        hasValidBounds = true

        L.polyline(latLngs, {
          color: '#f97316',
          weight: 1.5,
          opacity: 0.15,
          smoothFactor: 1,
        }).addTo(map)
      }

      if (hasValidBounds) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 })
      } else {
        map.setView([47.5, 13.5], 7) // Austria fallback
      }

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (polylines.length === 0) {
    return (
      <div className="w-full h-full rounded-2xl bg-white/[0.03] flex items-center justify-center text-muted-foreground">
        Keine Routen-Daten verfügbar
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-full rounded-2xl" style={{ minHeight: '100%' }} />
}
