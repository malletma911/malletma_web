/** Auto-compute difficulty from distance and elevation gain */
export function computeDifficulty(distance_km: number, elevation_m: number): string {
  const score = (distance_km / 40) + (elevation_m / 400)
  if (score < 3) return 'easy'
  if (score <= 6) return 'medium'
  if (score <= 10) return 'hard'
  return 'extreme'
}
