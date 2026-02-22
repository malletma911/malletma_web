import { SignJWT } from 'jose'

export const config = { runtime: 'edge' }

export default async function handler(request) {
  const code = new URL(request.url).searchParams.get('code')
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

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': `session=${session}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`,
    },
  })
}
