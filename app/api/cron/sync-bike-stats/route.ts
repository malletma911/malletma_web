import { NextRequest, NextResponse } from 'next/server'
import { syncBikeStats } from '@/lib/strava-sync'

export async function POST(req: NextRequest) {
  // Verify authorization: Vercel Cron or shared secret
  const authHeader = req.headers.get('authorization')
  const syncSecret = process.env.SYNC_SECRET
  const cronSecret = process.env.CRON_SECRET

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isSyncSecret = syncSecret && authHeader === `Bearer ${syncSecret}`

  if (!isVercelCron && !isSyncSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = process.env.STRAVA_OWNER_EMAIL
  if (!email) {
    return NextResponse.json({ error: 'STRAVA_OWNER_EMAIL not set' }, { status: 500 })
  }

  const result = await syncBikeStats(email)
  return NextResponse.json(result)
}

// Vercel Cron uses GET
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = process.env.STRAVA_OWNER_EMAIL
  if (!email) {
    return NextResponse.json({ error: 'STRAVA_OWNER_EMAIL not set' }, { status: 500 })
  }

  const result = await syncBikeStats(email)
  return NextResponse.json(result)
}
