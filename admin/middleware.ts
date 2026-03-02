import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  // Skip auth routes
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const session = request.cookies.get('session')?.value
  if (!session) {
    return NextResponse.redirect(new URL('/api/auth/login', request.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.AUTH0_SECRET)
    await jwtVerify(session, secret)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/api/auth/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
