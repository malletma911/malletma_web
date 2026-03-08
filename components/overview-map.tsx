'use client'

import { useEffect, useRef, useCallback } from 'react'
import type L from 'leaflet'

export interface EventPin {
  lat: number
  lon: number
  color: string
  label: string
  city: string
}

export default function OverviewMap({ pins }: { pins: EventPin[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const leafletRef = useRef<typeof L | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  const updateMarkers = useCallback(() => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map || pins.length === 0) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const bounds = L.latLngBounds([])

    pins.forEach((pin: EventPin) => {
      const pos: [number, number] = [pin.lat, pin.lon]
      bounds.extend(pos)

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:0;height:0">
          <div style="position:absolute;left:-20px;top:-20px;width:40px;height:40px;
            background:radial-gradient(circle,${pin.color}30 0%,transparent 70%);
            border-radius:50%;pointer-events:none"></div>
          <div style="position:absolute;left:-6px;top:-6px;width:12px;height:12px;
            background:${pin.color};border:2px solid white;border-radius:50%;
            box-shadow:0 0 10px ${pin.color}99,0 2px 4px rgba(0,0,0,0.5)"></div>
          <div style="position:absolute;left:50%;top:10px;transform:translateX(-50%);
            white-space:nowrap;font-size:10px;font-weight:700;color:${pin.color};
            letter-spacing:0.04em;text-shadow:0 1px 4px rgba(0,0,0,0.9),0 0 8px rgba(0,0,0,0.7);
            font-family:system-ui,-apple-system,sans-serif">${pin.label}</div>
          <div style="position:absolute;left:50%;top:23px;transform:translateX(-50%);
            white-space:nowrap;font-size:8.5px;color:rgba(255,255,255,0.45);
            text-shadow:0 1px 3px rgba(0,0,0,0.9);
            font-family:system-ui,-apple-system,sans-serif">${pin.city}</div>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })

      markersRef.current.push(L.marker(pos, { icon }).addTo(map))
    })

    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6 })
  }, [pins])

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return

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
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 14,
      }).addTo(map)

      leafletRef.current = L
      mapInstanceRef.current = map

      // Draw initial pins now that map is ready
      updateMarkers()
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        leafletRef.current = null
        markersRef.current = []
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-draw pins and reset bounds whenever the filtered set changes
  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  return (
    <div ref={mapRef} className="w-full h-full rounded-2xl" style={{ minHeight: '100%' }} />
  )
}
