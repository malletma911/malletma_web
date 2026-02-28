import { getSession } from '../../lib/session.js'
import { getSupabase } from '../../lib/supabase.js'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`)
  const code = url.searchParams.get('code')
  if (!code) return res.status(400).send('Missing code')

  const session = await getSession(req)
  if (!session) return res.redirect('/api/auth/login')
  const { email } = session

  // Code gegen Strava-Tokens tauschen
  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: Number(process.env.STRAVA_CLIENT_ID),
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()
  if (!tokenRes.ok) return res.status(401).json(tokens)

  // Benutzer und Token in Supabase speichern
  const supabase = getSupabase()

  await supabase.from('users').upsert({ email }, { onConflict: 'email' })

  await supabase.from('oauth_tokens').upsert({
    user_email: email,
    provider: 'strava',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(tokens.expires_at * 1000).toISOString(),
  }, { onConflict: 'user_email,provider' })

  return res.redirect('/')
}
