import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Event {
  id: string
  name: string
  date: string
  location: string
  distance_km: number
  elevation_m: number
  country: string
  status: string
  slug: string | null
  color: string | null
  bike_type: string | null
  participation: string | null
  route_polyline: unknown
  last_scanned_at: string | null
}

export default async function DashboardPage() {
  let items: Event[] = []
  let dbError: string | null = null

  try {
    const supabase = getSupabase()
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })

    if (error) dbError = error.message
    items = (events ?? []) as Event[]
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-zinc-500 mt-1">{items.length} Events in der Datenbank</p>
        </div>
        <Link
          href="/events/create"
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Neues Event
        </Link>
      </div>

      {dbError && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm font-mono">
          DB Error: {dbError}
        </div>
      )}

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-4 py-3 font-medium text-zinc-400">Event</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-400">Datum</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-400">Ort</th>
              <th className="text-right px-4 py-3 font-medium text-zinc-400">km</th>
              <th className="text-right px-4 py-3 font-medium text-zinc-400">Hm</th>
              <th className="text-center px-4 py-3 font-medium text-zinc-400">Route</th>
              <th className="text-center px-4 py-3 font-medium text-zinc-400">Teilnahme</th>
              <th className="text-center px-4 py-3 font-medium text-zinc-400">Sichtbar</th>
              <th className="text-right px-4 py-3 font-medium text-zinc-400">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {items.map(event => (
              <tr key={event.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {event.color && (
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                    )}
                    <span className="font-medium">{event.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {event.date ? new Date(event.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–'}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {event.location}{event.country ? ` (${event.country})` : ''}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{event.distance_km ?? '–'}</td>
                <td className="px-4 py-3 text-right tabular-nums">{event.elevation_m ?? '–'}</td>
                <td className="px-4 py-3 text-center">
                  {event.route_polyline ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-900/30 text-green-400 border border-green-800/50">GPS</span>
                  ) : (
                    <span className="text-zinc-600">–</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <ParticipationBadge participation={event.participation} />
                </td>
                <td className="px-4 py-3 text-center">
                  <PublishBadge status={event.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/events/${event.id}/edit`} className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                      Edit
                    </Link>
                    <Link href={`/events/${event.id}/rescan`} className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                      Rescan
                    </Link>
                    <Link href={`/events/${event.id}/history`} className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                      Log
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                  Noch keine Events vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ParticipationBadge({ participation }: { participation: string | null }) {
  const styles: Record<string, string> = {
    registered: 'bg-primary/20 text-primary border-primary/40',
    completed: 'bg-green-900/30 text-green-400 border-green-800/50',
    planned: 'bg-zinc-800/50 text-zinc-400 border-zinc-700',
    dnf: 'bg-red-900/20 text-red-400 border-red-800/50',
    dns: 'bg-red-900/20 text-red-400 border-red-800/50',
  }
  const labels: Record<string, string> = {
    registered: 'Dabei',
    completed: 'Absolviert',
    planned: 'Geplant',
    dnf: 'DNF',
    dns: 'DNS',
  }
  const p = participation ?? 'planned'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${styles[p] ?? styles.planned}`}>
      {labels[p] ?? p}
    </span>
  )
}

function PublishBadge({ status }: { status: string }) {
  const isLive = status === 'published' || status === 'active'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${isLive ? 'bg-green-900/30 text-green-400 border-green-800/50' : 'bg-zinc-800/50 text-zinc-500 border-zinc-700'}`}>
      {isLive ? 'Live' : 'Entwurf'}
    </span>
  )
}
