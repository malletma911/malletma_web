'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [fields, setFields] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setFields(data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unbekannter Fehler')
      router.refresh()
      router.push('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    const endpoint = fields.status === 'published' ? 'unpublish' : 'publish'
    const res = await fetch(`/api/events/${id}/${endpoint}`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) setFields(data)
  }

  async function handleDelete() {
    if (!confirm('Event wirklich löschen?')) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    router.push('/')
  }

  function updateField(key: string, value: unknown) {
    setFields(f => ({ ...f, [key]: value }))
  }

  if (loading) return <p className="text-zinc-500">Laden...</p>
  if (error && !fields.name) return <p className="text-red-400">{error}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{String(fields.name || 'Event bearbeiten')}</h1>
          <p className="text-zinc-500 mt-1">ID: {id}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePublish} className="px-4 py-2 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-800 transition-colors">
            {fields.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
          <button onClick={handleDelete} className="px-4 py-2 border border-red-800 text-red-400 rounded-lg text-sm hover:bg-red-900/20 transition-colors">
            Löschen
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Speichern...' : 'Speichern'}
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
          </p>
        </div>
      ) : null}

      {fields.last_scanned_at ? (
        <p className="mt-4 text-xs text-zinc-600">
          Letzter Scan: {new Date(String(fields.last_scanned_at)).toLocaleString('de-DE')}
        </p>
      ) : null}
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
  { key: 'color', label: 'Farbe (Hex)', type: 'text' },
  { key: 'url', label: 'Website', type: 'url' },
  { key: 'event_info_url', label: 'Event-Info URL', type: 'url' },
  { key: 'route_source_url', label: 'Routen-URL', type: 'url' },
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
