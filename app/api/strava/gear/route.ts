import { NextRequest, NextResponse } from 'next/server'
import { getStravaGearList, getAccessToken, fetchGearDetail, FRAME_TYPE_MAP } from '@/lib/strava-sync'

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

  // Single gear detail lookup: ?id=b12345
  const gearId = req.nextUrl.searchParams.get('id')
  if (gearId) {
    const accessToken = await getAccessToken(email)
    if (!accessToken) {
      return NextResponse.json({ error: 'Could not get Strava access token' }, { status: 500 })
    }

    const detail = await fetchGearDetail(accessToken, gearId)
    if (!detail) {
      return NextResponse.json({ error: 'Gear not found' }, { status: 404 })
    }

    return NextResponse.json({
      brand: detail.brand_name || null,
      model: detail.model_name || null,
      weight_kg: detail.weight > 0
        ? (detail.weight < 100
          ? Math.round(detail.weight * 10) / 10  // already in kg
          : Math.round(detail.weight / 100) / 10) // convert grams to kg
        : null,
      type: FRAME_TYPE_MAP[detail.frame_type] || null,
    })
  }

  // Full gear list
  const gear = await getStravaGearList(email)
  return NextResponse.json(gear)
}
