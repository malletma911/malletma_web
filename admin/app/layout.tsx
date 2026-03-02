import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { getSession } from '@/lib/session'

const geist = Geist({ subsets: ['latin'] })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Malletma Admin',
  description: 'Radevent-Dashboard Admin',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null
  try {
    session = await getSession()
  } catch {
    // Session not available (e.g. during static generation)
  }

  return (
    <html lang="de" className="dark">
      <body className={`${geist.className} antialiased bg-zinc-950 text-zinc-100 min-h-screen`}>
        {session && (
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
        )}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
