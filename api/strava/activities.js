import { getSession } from '../../lib/session.js'
import { getSupabase } from '../../lib/supabase.js'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  const session = await getSession(req)
  if (!session) return res.status(401).json({ error: 'Nicht eingeloggt' })
  const { email } = session

  // Token aus Supabase laden
  const supabase = getSupabase()
  const { data: tokenRow } = await supabase
    .from('oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_email', email)
    .eq('provider', 'strava')
    .single()

  if (!tokenRow) return res.status(404).json({ error: 'Kein Strava-Token gefunden' })

  // Token erneuern falls abgelaufen
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
    if (!refreshRes.ok) return res.status(401).json({ error: 'Token-Refresh fehlgeschlagen' })

    accessToken = refreshed.access_token
    await supabase.from('oauth_tokens').upsert({
      user_email: email,
      provider: 'strava',
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
    }, { onConflict: 'user_email,provider' })
  }

  // Aktivitäten von Strava laden
  const activitiesRes = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=10',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  const activities = await activitiesRes.json()
  return res.status(200).json(activities)
}
