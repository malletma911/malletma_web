'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type InputMode = 'urls' | 'gpx' | 'manual'

export default function CreateEventPage() {
  const router = useRouter()
  const [mode, setMode] = useState<InputMode>('urls')
  const [eventInfoUrl, setEventInfoUrl] = useState('')
  const [routeSourceUrl, setRouteSourceUrl] = useState('')
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, unknown>>({})
  const [step, setStep] = useState<'input' | 'review'>('input')
  const [toolCalls, setToolCalls] = useState<string[]>([])

  async function handleAnalyze() {
    setLoading(true)
    setError('')

    try {
      let gpxContent: string | undefined

      if (mode === 'gpx' && gpxFile) {
        gpxContent = await gpxFile.text()
      }

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventInfoUrl: eventInfoUrl || undefined,
          routeSourceUrl: routeSourceUrl || undefined,
          gpxContent,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setFields(data.fields)
      setToolCalls(data.toolCalls ?? [])
      setStep('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analyse fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, status: 'draft' }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unbekannter Fehler')

      window.location.href = '/'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  function updateField(key: string, value: unknown) {
    setFields(f => ({ ...f, [key]: value }))
  }

  if (step === 'review') {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Event prüfen</h1>
            <p className="text-zinc-500 mt-1">
              Agent hat {toolCalls.length} Tool-Aufrufe gemacht: {toolCalls.join(', ')}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('input')} className="px-4 py-2 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-800 transition-colors">
              Zurück
            </button>
            <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? 'Speichern...' : 'Event anlegen'}
            </button>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {EDITABLE_FIELDS.map(({ key, label, type }) => (
            <div key={key} className={type === 'textarea' ? 'lg:col-span-2' : ''}>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
              {type === 'textarea' ? (
                <textarea
                  value={String(fields[key] ?? '')}
                  onChange={e => updateField(key, e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600"
                />
              ) : type === 'select' ? (
                <select
                  value={String(fields[key] ?? '')}
                  onChange={e => updateField(key, e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600"
                >
                  <option value="">–</option>
                  {getOptions(key).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={type}
                  value={String(fields[key] ?? '')}
                  onChange={e => updateField(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600"
                />
              )}
            </div>
          ))}
        </div>

        {fields.route_polyline ? (
          <div className="mt-6 p-4 bg-green-900/10 border border-green-800/30 rounded-lg">
            <p className="text-green-400 text-sm font-medium">
              Route vorhanden: {Array.isArray(fields.route_polyline) ? (fields.route_polyline as unknown[]).length : '?'} Punkte
              {fields.min_elevation_m != null ? ` · ${String(fields.min_elevation_m)}–${String(fields.max_elevation_m)} m` : ''}
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Neues Event</h1>

      <div className="flex gap-2 mb-8">
        {(['urls', 'gpx', 'manual'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'
            }`}
          >
            {m === 'urls' ? 'URLs + Agent' : m === 'gpx' ? 'GPX Upload' : 'Manuell'}
          </button>
        ))}
      </div>

      {error && <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">{error}</div>}

      <div className="space-y-4 max-w-xl">
        {(mode === 'urls' || mode === 'gpx') && (
          <>
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Event-Info URL</label>
              <input
                type="url"
                placeholder="https://www.event-website.com"
                value={eventInfoUrl}
                onChange={e => setEventInfoUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600 placeholder:text-zinc-700"
              />
            </div>
            {mode === 'urls' && (
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Routen-URL (Komoot, RideWithGPS, GPX)</label>
                <input
                  type="url"
                  placeholder="https://www.komoot.com/tour/..."
                  value={routeSourceUrl}
                  onChange={e => setRouteSourceUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600 placeholder:text-zinc-700"
                />
              </div>
            )}
            {mode === 'gpx' && (
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">GPX Datei</label>
                <input
                  type="file"
                  accept=".gpx"
                  onChange={e => setGpxFile(e.target.files?.[0] ?? null)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm file:bg-zinc-800 file:border-0 file:text-zinc-400 file:mr-3 file:px-3 file:py-1 file:rounded"
                />
              </div>
            )}
            <button
              onClick={handleAnalyze}
              disabled={loading || (!eventInfoUrl && !routeSourceUrl && !gpxFile)}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Agent analysiert...' : 'Mit Agent analysieren'}
            </button>
          </>
        )}

        {mode === 'manual' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {EDITABLE_FIELDS.map(({ key, label, type }) => (
                <div key={key} className={type === 'textarea' ? 'lg:col-span-2' : ''}>
                  <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
                  {type === 'textarea' ? (
                    <textarea
                      value={String(fields[key] ?? '')}
                      onChange={e => updateField(key, e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600"
                    />
                  ) : type === 'select' ? (
                    <select
                      value={String(fields[key] ?? '')}
                      onChange={e => updateField(key, e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600"
                    >
                      <option value="">–</option>
                      {getOptions(key).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={String(fields[key] ?? '')}
                      onChange={e => updateField(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600"
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={loading || !fields.name}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Speichern...' : 'Event anlegen'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const EDITABLE_FIELDS: { key: string; label: string; type: string }[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'short_name', label: 'Kurzname', type: 'text' },
  { key: 'slug', label: 'Slug', type: 'text' },
  { key: 'date', label: 'Datum', type: 'date' },
  { key: 'location', label: 'Ort', type: 'text' },
  { key: 'city', label: 'Stadt', type: 'text' },
  { key: 'country', label: 'Land', type: 'text' },
  { key: 'distance_km', label: 'Distanz (km)', type: 'number' },
  { key: 'elevation_m', label: 'Höhenmeter', type: 'number' },
  { key: 'type', label: 'Typ', type: 'select' },
  { key: 'bike_type', label: 'Rad-Typ', type: 'select' },
  { key: 'difficulty', label: 'Schwierigkeit', type: 'select' },
  { key: 'gradient_class', label: 'Profil', type: 'select' },
  { key: 'participation', label: 'Teilnahme', type: 'select' },
  { key: 'participants', label: 'Teilnehmer', type: 'number' },
  { key: 'start_time', label: 'Startzeit', type: 'text' },
  { key: 'url', label: 'Website', type: 'url' },
  { key: 'notes', label: 'Notizen', type: 'textarea' },
]

function getOptions(key: string): string[] {
  switch (key) {
    case 'type': return ['race', 'granfondo', 'gravel', 'charity']
    case 'bike_type': return ['road', 'gravel', 'mtb', 'tt']
    case 'difficulty': return ['easy', 'medium', 'hard', 'extreme']
    case 'gradient_class': return ['flat', 'hilly', 'mountainous']
    case 'participation': return ['planned', 'registered', 'completed', 'dnf', 'dns']
    default: return []
  }
}
