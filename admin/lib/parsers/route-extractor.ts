import * as cheerio from 'cheerio'
import { parseGpx, ParsedRoute } from './gpx'

/**
 * Extract route data from various URL sources:
 * - Komoot: Parse __NEXT_DATA__ JSON
 * - RideWithGPS: Fetch .json endpoint
 * - Generic: Try to find GPX download link
 */
export async function extractRouteFromUrl(url: string): Promise<ParsedRoute | null> {
  const hostname = new URL(url).hostname

  if (hostname.includes('komoot.com') || hostname.includes('komoot.de')) {
    return extractFromKomoot(url)
  }
  if (hostname.includes('ridewithgps.com')) {
    return extractFromRideWithGPS(url)
  }
  return extractGeneric(url)
}

async function extractFromKomoot(url: string): Promise<ParsedRoute | null> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MalletmaBot/1.0)' },
  })
  if (!res.ok) return null
  const html = await res.text()
  const $ = cheerio.load(html)

  const scriptTag = $('#__NEXT_DATA__').html()
  if (!scriptTag) return null

  try {
    const data = JSON.parse(scriptTag)
    const tour = data?.props?.pageProps?.tour
    if (!tour?.coordinates) return null

    const coords = tour.coordinates as { lat: number; lng: number; alt: number }[]
    const points = coords.map(c => ({ lat: c.lat, lng: c.lng, ele: c.alt }))

    const { simplifyPolyline, buildElevationProfile } = await import('./utils')
    const simplified = simplifyPolyline(points, 0.0001)
    const { profile, min, max, totalDistance } = buildElevationProfile(points)

    return {
      polyline: simplified,
      elevation_profile: profile,
      distance_km: Math.round(totalDistance * 10) / 10,
      min_elevation_m: Math.round(min),
      max_elevation_m: Math.round(max),
    }
  } catch {
    return null
  }
}

async function extractFromRideWithGPS(url: string): Promise<ParsedRoute | null> {
  // RideWithGPS has a JSON endpoint: /routes/XXXXX.json
  const match = url.match(/\/(routes|trips)\/(\d+)/)
  if (!match) return null

  const jsonUrl = `https://ridewithgps.com/${match[1]}/${match[2]}.json`
  const res = await fetch(jsonUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MalletmaBot/1.0)' },
  })
  if (!res.ok) return null

  try {
    const data = await res.json()
    const trackPoints = data.track_points ?? data.route?.track_points
    if (!trackPoints?.length) return null

    const points = trackPoints.map((p: { x: number; y: number; e: number }) => ({
      lat: p.y,
      lng: p.x,
      ele: p.e,
    }))

    const { simplifyPolyline, buildElevationProfile } = await import('./utils')
    const simplified = simplifyPolyline(points, 0.0001)
    const { profile, min, max, totalDistance } = buildElevationProfile(points)

    return {
      polyline: simplified,
      elevation_profile: profile,
      distance_km: Math.round(totalDistance * 10) / 10,
      min_elevation_m: Math.round(min),
      max_elevation_m: Math.round(max),
    }
  } catch {
    return null
  }
}

async function extractGeneric(url: string): Promise<ParsedRoute | null> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MalletmaBot/1.0)' },
  })
  if (!res.ok) return null

  const contentType = res.headers.get('content-type') ?? ''

  // If the URL directly serves GPX
  if (contentType.includes('xml') || url.endsWith('.gpx')) {
    const gpxText = await res.text()
    try {
      return parseGpx(gpxText)
    } catch {
      return null
    }
  }

  // Try to find a GPX download link in the HTML
  const html = await res.text()
  const $ = cheerio.load(html)
  const gpxLink = $('a[href*=".gpx"], a[href*="download"][href*="gpx"]').first().attr('href')

  if (gpxLink) {
    const fullUrl = new URL(gpxLink, url).toString()
    const gpxRes = await fetch(fullUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MalletmaBot/1.0)' },
    })
    if (gpxRes.ok) {
      const gpxText = await gpxRes.text()
      try {
        return parseGpx(gpxText)
      } catch {
        return null
      }
    }
  }

  return null
}
