'use client'

import { useEffect, useRef } from 'react'

export interface EventPin {
  lat: number
  lon: number
  color: string
  label: string
  city: string
}

export default function OverviewMap({ pins }: { pins: EventPin[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || instanceRef.current || pins.length === 0) return

    import('leaflet').then(L => {
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      if (!mapRef.current) return

      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      })
      instanceRef.current = map

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 14,
      }).addTo(map)

      const bounds = L.latLngBounds([])

      pins.forEach(pin => {
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

        L.marker(pos, { icon }).addTo(map)
      })

      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6 })
    })

    return () => {
      if (instanceRef.current) {
        ;(instanceRef.current as { remove: () => void }).remove()
        instanceRef.current = null
      }
    }
  }, [pins])

  return (
    <div ref={mapRef} className="w-full h-full rounded-2xl" style={{ minHeight: '100%' }} />
  )
}
