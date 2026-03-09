import { NextRequest, NextResponse } from 'next/server'
import { getStravaGearList } from '@/lib/strava-sync'

export async function GET(req: NextRequest) {
  // Verify shared secret for cross-app calls
  const authHeader = req.headers.get('authorization')
  const syncSecret = process.env.SYNC_SECRET
  if (syncSecret && authHeader !== `Bearer ${syncSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = process.env.STRAVA_OWNER_EMAIL
  if (!email) {
    return NextResponse.json({ error: 'STRAVA_OWNER_EMAIL not set' }, { status: 500 })
  }

  const gear = await getStravaGearList(email)
  return NextResponse.json(gear)
}
