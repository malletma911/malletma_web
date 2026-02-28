import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const supabase = getSupabase()
  const { data: tokenRow } = await supabase
    .from('oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_email', session.email)
    .eq('provider', 'strava')
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'Kein Strava-Token' }, { status: 404 })

  let accessToken = tokenRow.access_token
  if (new Date(tokenRow.expires_at) < new Date()) {
    const refreshRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: Number(process.env.STRAVA_CLIENT_ID),
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: tokenRow.refresh_token,
      }),
    })
    const refreshed = await refreshRes.json()
    if (!refreshRes.ok) return NextResponse.json({ error: 'Token-Refresh fehlgeschlagen' }, { status: 401 })

    accessToken = refreshed.access_token
    await supabase.from('oauth_tokens').upsert({
      user_email: session.email,
      provider: 'strava',
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
    }, { onConflict: 'user_email,provider' })
  }

  const activitiesRes = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=20',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const activities = await activitiesRes.json()
  return NextResponse.json(activities)
}
