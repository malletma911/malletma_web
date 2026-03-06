import { getSupabaseAdmin } from './supabase'
import { StravaActivity } from '@/types'

async function getAccessToken(email: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const { data: tokenRow } = await supabase
    .from('oauth_tokens')
    .select('access_token, expires_at, refresh_token')
    .eq('user_email', email)
    .eq('provider', 'strava')
    .single()

  if (!tokenRow) return null

  if (new Date(tokenRow.expires_at) >= new Date()) {
    return tokenRow.access_token
  }

  // Token expired — refresh
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

  if (!refreshRes.ok) return null
  const refreshed = await refreshRes.json()

  await supabase.from('oauth_tokens').upsert({
    user_email: email,
    provider: 'strava',
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
  }, { onConflict: 'user_email,provider' })

  return refreshed.access_token
}

export async function getStravaActivities(email: string, perPage = 30): Promise<StravaActivity[]> {
  const accessToken = await getAccessToken(email)
  if (!accessToken) return []

  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 300 },
    }
  )
  if (!res.ok) return []
  return res.json()
}
