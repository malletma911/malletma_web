import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Malletma Admin',
  description: 'Radevent-Dashboard Admin',
}

async function getSessionSafe(): Promise<{ email: string; name: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return null
    const secret = process.env.AUTH0_SECRET
    if (!secret) return null
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return payload as { email: string; name: string }
  } catch {
    return null
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session: { email: string; name: string } | null = null
  try {
    session = await getSessionSafe()
  } catch {
    // ignore
  }

  return (
    <html lang="de" className="dark">
      <body className="font-sans antialiased bg-zinc-950 text-zinc-100 min-h-screen">
        {session ? (
          <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/" className="font-bold text-lg tracking-wide">
                  <span className="text-orange-500">MALLETMA</span> Admin
                </Link>
                <div className="flex items-center gap-1">
                  <Link href="/" className="px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                    Events
                  </Link>
                  <Link href="/events/create" className="px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                    + Neues Event
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span>{session.email}</span>
                <a href="/api/auth/logout" className="text-zinc-400 hover:text-zinc-100 transition-colors">
                  Logout
                </a>
              </div>
            </div>
          </nav>
        ) : null}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
