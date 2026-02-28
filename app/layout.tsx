import type { Metadata } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import './globals.css'
import Nav from '@/components/nav'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

export const metadata: Metadata = {
  title: 'Maik Malletschek — Radsport',
  description: 'Persönliche Radsport-Website: Garage, Strava-Stats und Events.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className={`${inter.variable} ${bebasNeue.variable} font-sans antialiased bg-background text-foreground`}>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}
