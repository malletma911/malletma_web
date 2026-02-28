import { next } from '@vercel/edge'
import { jwtVerify } from 'jose'

export default async function middleware(request) {
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    return next()
  }

  const cookieHeader = request.headers.get('cookie') || ''
  const sessionCookie = cookieHeader.split(';').find(c => c.trim().startsWith('session='))
  if (!sessionCookie) {
    return Response.redirect(new URL('/api/auth/login', request.url))
  }

  const sessionToken = sessionCookie.trim().slice('session='.length)
  const secret = new TextEncoder().encode(process.env.AUTH0_SECRET)

  try {
    await jwtVerify(sessionToken, secret)
  } catch {
    return Response.redirect(new URL('/api/auth/login', request.url))
  }

  return next()
}
