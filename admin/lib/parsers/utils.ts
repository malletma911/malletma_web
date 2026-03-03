export interface LatLng {
  lat: number
  lng: number
}

export interface ElevationPoint {
  distance_km: number
  elevation_m: number
}

/** Haversine distance in meters */
export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sin2Lat = Math.sin(dLat / 2) ** 2
  const sin2Lng = Math.sin(dLng / 2) ** 2
  const h = sin2Lat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sin2Lng
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Ramer–Douglas–Peucker simplification */
export function simplifyPolyline(points: LatLng[], epsilon: number): LatLng[] {
  if (points.length <= 2) return points

  let maxDist = 0
  let maxIdx = 0
  const first = points[0]
  const last = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDist(points[i], first, last)
    if (d > maxDist) {
      maxDist = d
      maxIdx = i
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPolyline(points.slice(0, maxIdx + 1), epsilon)
    const right = simplifyPolyline(points.slice(maxIdx), epsilon)
    return [...left.slice(0, -1), ...right]
  }

  return [first, last]
}

function perpendicularDist(p: LatLng, a: LatLng, b: LatLng): number {
  const dx = b.lng - a.lng
  const dy = b.lat - a.lat
  const num = Math.abs(dy * p.lng - dx * p.lat + b.lng * a.lat - b.lat * a.lng)
  const den = Math.sqrt(dy * dy + dx * dx)
  return den === 0 ? haversine(p, a) : (num / den) * 111000
}

/** Build elevation profile from points with elevation */
export function buildElevationProfile(
  points: (LatLng & { ele?: number })[],
): { profile: ElevationPoint[]; min: number; max: number; totalDistance: number; elevationGain: number } {
  const profile: ElevationPoint[] = []
  let cumDist = 0
  let min = Infinity
  let max = -Infinity
  let elevationGain = 0

  for (let i = 0; i < points.length; i++) {
    if (i > 0) {
      cumDist += haversine(points[i - 1], points[i])
    }
    const ele = points[i].ele ?? 0
    if (ele < min) min = ele
    if (ele > max) max = ele
    if (i > 0) {
      const delta = ele - (points[i - 1].ele ?? 0)
      if (delta > 0) elevationGain += delta
    }
    profile.push({ distance_km: cumDist / 1000, elevation_m: ele })
  }

  // Simplify elevation to ~200 points max
  if (profile.length > 200) {
    const step = Math.ceil(profile.length / 200)
    const simplified: ElevationPoint[] = []
    for (let i = 0; i < profile.length; i += step) {
      simplified.push(profile[i])
    }
    if (simplified[simplified.length - 1] !== profile[profile.length - 1]) {
      simplified.push(profile[profile.length - 1])
    }
    return { profile: simplified, min, max, totalDistance: cumDist / 1000, elevationGain: Math.round(elevationGain) }
  }

  return { profile, min, max, totalDistance: cumDist / 1000, elevationGain: Math.round(elevationGain) }
}
