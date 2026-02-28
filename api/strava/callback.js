import { jwtVerify } from 'jose'
import { getSupabase } from '../../lib/supabase.js'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`)
  const code = url.searchParams.get('code')
  if (!code) return res.status(400).send('Missing code')

  // Benutzer aus Session-Cookie lesen
  const cookieHeader = req.headers['cookie'] || ''
  const sessionCookie = cookieHeader.split(';').find(c => c.trim().startsWith('session='))
  if (!sessionCookie) return res.redirect('/api/auth/login')

  const sessionToken = sessionCookie.trim().slice('session='.length)
  const secret = new TextEncoder().encode(process.env.AUTH0_SECRET)

  let email
  try {
    const { payload } = await jwtVerify(sessionToken, secret)
    email = payload.email
  } catch {
    return res.redirect('/api/auth/login')
  }

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
