import { jwtVerify } from 'jose'

export const config = {
  matcher: ['/((?!api/auth).*)'],
}

export default async function middleware(request) {
  const token = request.cookies.get('session')?.value
  if (!token) {
    return Response.redirect(new URL('/api/auth/login', request.url))
  }
  try {
    const secret = new TextEncoder().encode(process.env.AUTH0_SECRET)
    await jwtVerify(token, secret)
  } catch {
    return Response.redirect(new URL('/api/auth/login', request.url))
  }
}
