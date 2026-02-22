export const config = {
  matcher: ['/((?!api/auth).*)'],
}

async function verifySession(token, secret) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [header, payload, sig] = parts
  const signature = Uint8Array.from(
    atob(sig.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  )
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    enc.encode(`${header}.${payload}`)
  )
  if (!valid) return false

  const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  return !exp || exp > Math.floor(Date.now() / 1000)
}

export default async function middleware(request) {
  const token = request.cookies.get('session')?.value
  if (!token) {
    return Response.redirect(new URL('/api/auth/login', request.url))
  }
  try {
    const valid = await verifySession(token, process.env.AUTH0_SECRET)
    if (!valid) {
      return Response.redirect(new URL('/api/auth/login', request.url))
    }
  } catch {
    return Response.redirect(new URL('/api/auth/login', request.url))
  }
}
