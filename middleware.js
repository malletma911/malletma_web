import { next } from '@vercel/edge'

export default function middleware(request) {
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    return next()
  }

  const cookieHeader = request.headers.get('cookie') || ''
  const hasSession = cookieHeader.split(';').some(c => c.trim().startsWith('session='))

  if (!hasSession) {
    return Response.redirect(new URL('/api/auth/login', request.url))
  }

  return next()
}
