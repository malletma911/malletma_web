import { SignJWT } from 'jose'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return new Response('Missing code', { status: 400 })

  const tokenRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
    }),
  })
  const tokens = await tokenRes.json()
  if (!tokenRes.ok) return new Response('Authentication failed', { status: 401 })

  const user = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  }).then(r => r.json())

  const secret = new TextEncoder().encode(process.env.AUTH0_SECRET)
  const session = await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 28800,
  })

  redirect('/')
}
