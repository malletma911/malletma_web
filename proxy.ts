// Auth entfernen für public launch: diese Datei löschen oder matcher auf [] setzen
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/api/auth/login', request.url))
  }

  const secret = new TextEncoder().encode(process.env.AUTH0_SECRET)
  try {
    await jwtVerify(sessionToken, secret)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/api/auth/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
