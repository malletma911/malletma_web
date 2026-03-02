import * as cheerio from 'cheerio'
import { LatLng, simplifyPolyline, buildElevationProfile } from './utils'

interface GpxPoint extends LatLng {
  ele?: number
}

export interface ParsedRoute {
  /** [lat, lng] tuples for Leaflet */
  polyline: [number, number][]
  /** {d: km, e: elevation_m} for Recharts */
  elevation_profile: { d: number; e: number }[]
  distance_km: number
  min_elevation_m: number
  max_elevation_m: number
}

export function parseGpx(gpxXml: string): ParsedRoute {
  const $ = cheerio.load(gpxXml, { xmlMode: true })
  const points: GpxPoint[] = []

  // Support both <trkpt> and <rtept>
  const selectors = ['trkpt', 'rtept', 'wpt']
  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const lat = parseFloat($(el).attr('lat') ?? '')
      const lng = parseFloat($(el).attr('lon') ?? '')
      if (isNaN(lat) || isNaN(lng)) return
      const eleText = $(el).find('ele').first().text()
      const ele = eleText ? parseFloat(eleText) : undefined
      points.push({ lat, lng, ele: isNaN(ele as number) ? undefined : ele })
    })
    if (points.length > 0) break
  }

  if (points.length === 0) {
    throw new Error('No track points found in GPX')
  }

  // Simplify polyline to ~500 points (epsilon in degrees ≈ 0.0001 ~ 11m)
  const simplified = simplifyPolyline(points, 0.0001)

  const { profile, min, max, totalDistance } = buildElevationProfile(points)

  return {
    // Convert to [lat, lng] tuples for Leaflet
    polyline: simplified.map(p => [p.lat, p.lng] as [number, number]),
    // Convert to short keys {d, e} for Recharts
    elevation_profile: profile.map(p => ({ d: Math.round(p.distance_km * 10) / 10, e: Math.round(p.elevation_m) })),
    distance_km: Math.round(totalDistance * 10) / 10,
    min_elevation_m: Math.round(min),
    max_elevation_m: Math.round(max),
  }
}
