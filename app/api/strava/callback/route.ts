import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return new Response('Missing code', { status: 400 })

  const session = await getSession()
  if (!session) redirect('/api/auth/login')

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
  if (!tokenRes.ok) return new Response('Strava auth failed', { status: 401 })

  const supabase = getSupabase()
  await supabase.from('users').upsert({ email: session.email }, { onConflict: 'email' })
  await supabase.from('oauth_tokens').upsert({
    user_email: session.email,
    provider: 'strava',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(tokens.expires_at * 1000).toISOString(),
  }, { onConflict: 'user_email,provider' })

  redirect('/')
}
