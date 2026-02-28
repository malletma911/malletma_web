'use client'

import { useEffect, useRef } from 'react'

interface Props {
  route: [number, number][]
  color: string
  center: [number, number]
  zoom: number
}

export default function RouteMap({ route, color, center, zoom }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return

    // Leaflet dynamisch laden
    import('leaflet').then(L => {
      // CSS laden
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      if (!mapRef.current) return

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(center, zoom)
      instanceRef.current = map

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 14,
      }).addTo(map)

      // Route zeichnen
      const polyline = L.polyline(route, { color, weight: 3, opacity: 0.9 }).addTo(map)

      // Start/Ziel Marker
      const startIcon = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.5)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })
      L.marker(route[0], { icon: startIcon }).addTo(map).bindPopup('Start / Ziel')

      map.fitBounds(polyline.getBounds(), { padding: [20, 20] })
    })

    return () => {
      if (instanceRef.current) {
        ;(instanceRef.current as { remove: () => void }).remove()
        instanceRef.current = null
      }
    }
  }, [route, color, center, zoom])

  return (
    <div ref={mapRef} className="w-full h-full rounded-xl" style={{ minHeight: '100%' }} />
  )
}
