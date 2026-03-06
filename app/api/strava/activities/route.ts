import { NextResponse } from 'next/server'
import { getStravaActivities } from '@/lib/strava'

export async function GET() {
  const email = process.env.STRAVA_OWNER_EMAIL ?? ''
  const activities = await getStravaActivities(email, 20)

  if (activities.length === 0) {
    return NextResponse.json({ error: 'Keine Aktivitäten gefunden' }, { status: 404 })
  }

  return NextResponse.json(activities)
}
