export const dynamic = 'force-dynamic'

import { getSupabase } from '@/lib/supabase'
import { Event } from '@/types'

async function getEvents(): Promise<Event[]> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('events')
    .select('*')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
  return data ?? []
}

const typeLabels: Record<string, string> = {
  race: 'Rennen',
  gran_fondo: 'Gran Fondo',
  training: 'Training',
}

const typeColors: Record<string, string> = {
  race: 'text-red-400 border-red-400/20 bg-red-400/10',
  gran_fondo: 'text-primary border-primary/20 bg-primary/10',
  training: 'text-blue-400 border-blue-400/20 bg-blue-400/10',
}

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-3">Kalender</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-6xl md:text-8xl tracking-wider">EVENTS</h1>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-32 text-muted-foreground">
            <p className="text-6xl mb-6">🏁</p>
            <p className="text-xl">Keine bevorstehenden Events.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const date = new Date(event.date)
              const daysUntil = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div key={event.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 hover:border-primary/30 transition-colors">
                  <div className="flex-shrink-0 text-center bg-muted rounded-xl p-4 min-w-[80px]">
                    <p className="text-2xl font-bold">{date.getDate()}</p>
                    <p className="text-xs text-muted-foreground uppercase">
                      {date.toLocaleDateString('de-DE', { month: 'short' })}
                    </p>
                    <p className="text-xs text-muted-foreground">{date.getFullYear()}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h2 className="text-xl font-bold">{event.name}</h2>
                      {event.type && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColors[event.type] ?? 'text-muted-foreground border-border bg-muted'}`}>
                          {typeLabels[event.type] ?? event.type}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                      {event.location && <span>📍 {event.location}</span>}
                      {event.distance_km && <span>📏 {event.distance_km} km</span>}
                    </div>
                    {event.notes && <p className="text-sm text-muted-foreground mt-2">{event.notes}</p>}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {daysUntil === 0 ? 'Heute!' : daysUntil === 1 ? 'Morgen' : `in ${daysUntil} Tagen`}
                    </span>
                    {event.url && (
                      <a href={event.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                        Zur Veranstaltung →
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
