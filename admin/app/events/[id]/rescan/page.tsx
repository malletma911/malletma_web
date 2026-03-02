'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface DiffEntry {
  old: unknown
  new: unknown
}

export default function RescanPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [eventInfoUrl, setEventInfoUrl] = useState('')
  const [routeSourceUrl, setRouteSourceUrl] = useState('')
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [diff, setDiff] = useState<Record<string, DiffEntry> | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [newFields, setNewFields] = useState<Record<string, unknown>>({})

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.name) setEventName(data.name)
        if (data.event_info_url) setEventInfoUrl(data.event_info_url)
        if (data.route_source_url) setRouteSourceUrl(data.route_source_url)
      })
      .catch(() => {})
  }, [id])

  async function handleRescan() {
    setLoading(true)
    setError('')
    try {
      let gpxContent: string | undefined
      if (gpxFile) {
        gpxContent = await gpxFile.text()
      }

      const res = await fetch('/api/agent/rescan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          eventInfoUrl: eventInfoUrl || undefined,
          routeSourceUrl: routeSourceUrl || undefined,
          gpxContent,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setDiff(data.diff)
      setNewFields(data.newFields)
      setSelected(new Set(Object.keys(data.diff)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rescan fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  async function handleApply() {
    if (selected.size === 0) return
    setLoading(true)
    setError('')

    const fieldsToApply: Record<string, unknown> = {}
    for (const key of selected) {
      fieldsToApply[key] = newFields[key]
    }

    try {
      const res = await fetch('/api/agent/rescan/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, fieldsToApply }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      router.push(`/events/${id}/edit`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Übernahme fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  function toggleField(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{eventName ? `Rescan: ${eventName}` : 'Rescan'}</h1>
      <p className="text-zinc-500 mb-8">ID: {id}</p>

      {error && <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">{error}</div>}

      {!diff && (
        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Event-Info URL (optional, überschreibt gespeicherte)</label>
            <input
              type="url"
              value={eventInfoUrl}
              onChange={e => setEventInfoUrl(e.target.value)}
              placeholder="Leer = gespeicherte URL verwenden"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600 placeholder:text-zinc-700"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Routen-URL (optional)</label>
            <input
              type="url"
              value={routeSourceUrl}
              onChange={e => setRouteSourceUrl(e.target.value)}
              placeholder="Leer = gespeicherte URL verwenden"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600 placeholder:text-zinc-700"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">GPX-Datei (optional)</label>
            <input
              type="file"
              accept=".gpx,application/gpx+xml"
              onChange={e => setGpxFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-zinc-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-zinc-700 file:bg-zinc-800 file:text-zinc-300 file:text-sm file:cursor-pointer hover:file:bg-zinc-700 file:transition-colors"
            />
            {gpxFile && <p className="text-xs text-zinc-500 mt-1">{gpxFile.name}</p>}
          </div>
          <button
            onClick={handleRescan}
            disabled={loading}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Agent scannt...' : 'Rescan starten'}
          </button>
        </div>
      )}

      {diff && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-zinc-400">{Object.keys(diff).length} Unterschiede gefunden</p>
            <div className="flex gap-3">
              <button onClick={() => setDiff(null)} className="px-4 py-2 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-800 transition-colors">
                Nochmal scannen
              </button>
              <button
                onClick={handleApply}
                disabled={loading || selected.size === 0}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Anwenden...' : `${selected.size} Felder übernehmen`}
              </button>
            </div>
          </div>

          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">Feld</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">Aktuell</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">Neu</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(diff).map(([key, { old: oldVal, new: newVal }]) => (
                  <tr key={key} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggleField(key)}
                        className="accent-orange-600"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{key}</td>
                    <td className="px-4 py-3 text-red-400/70">
                      {formatValue(oldVal)}
                    </td>
                    <td className="px-4 py-3 text-green-400/70">
                      {formatValue(newVal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function formatValue(v: unknown): string {
  if (v == null) return '–'
  if (typeof v === 'object') {
    const s = JSON.stringify(v)
    return s.length > 80 ? s.slice(0, 77) + '...' : s
  }
  return String(v)
}
