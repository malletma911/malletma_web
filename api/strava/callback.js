import { jwtVerify } from 'jose'
import { getSupabase } from '../../lib/supabase.js'

export const config = { runtime: 'nodejs' }

export default async function handler(request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) return new Response('Missing code', { status: 400 })

  // Benutzer aus Session-Cookie lesen
  const cookieHeader = request.headers.get('cookie') || ''
  const sessionCookie = cookieHeader.split(';').find(c => c.trim().startsWith('session='))
  if (!sessionCookie) return Response.redirect(new URL('/api/auth/login', request.url))

  const sessionToken = sessionCookie.trim().slice('session='.length)
  const secret = new TextEncoder().encode(process.env.AUTH0_SECRET)

  let email
  try {
    const { payload } = await jwtVerify(sessionToken, secret)
    email = payload.email
  } catch {
    return Response.redirect(new URL('/api/auth/login', request.url))
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
  if (!tokenRes.ok) return new Response(JSON.stringify(tokens), { status: 401, headers: { 'content-type': 'application/json' } })

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

  return Response.redirect(new URL('/', request.url))
}
