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
        else {
          // Normalize legacy status values
          if (data.status === 'active') data.status = 'published'
          setFields(data)
        }
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

      window.location.href = '/'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const isPublished = fields.status === 'published'

  async function handlePublish() {
    const endpoint = isPublished ? 'unpublish' : 'publish'
    const res = await fetch(`/api/events/${id}/${endpoint}`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      // Only update status locally, don't overwrite other unsaved edits
      updateField('status', data.status)
    }
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
          <button onClick={handlePublish} className={`px-4 py-2 border rounded-lg text-sm transition-colors ${isPublished ? 'border-green-800 text-green-400 hover:bg-green-900/20' : 'border-zinc-700 hover:bg-zinc-800'}`}>
            {isPublished ? 'Unpublish' : 'Publish'}
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
            ) : type === 'color' ? (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={String(fields[key] ?? '#a1a1aa')}
                  onChange={e => updateField(key, e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={String(fields[key] ?? '')}
                  onChange={e => updateField(key, e.target.value)}
                  placeholder="#60a5fa"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600 font-mono"
                />
              </div>
            ) : (
              <input
                type={type === 'number' ? 'number' : type}
                value={String(fields[key] ?? '')}
                onChange={e => updateField(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-600"
              />
            )}
          </div>
        ))}
      </div>

      {/* Route & Metadaten */}
      <div className="mt-8 space-y-3">
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Routendaten</h3>
        {fields.route_polyline ? (
          <div className="p-4 bg-green-900/10 border border-green-800/30 rounded-lg">
            <p className="text-green-400 text-sm font-medium">
              Route vorhanden: {Array.isArray(fields.route_polyline) ? (fields.route_polyline as unknown[]).length : '?'} GPS-Punkte
            </p>
            {fields.elevation_profile ? (
              <p className="text-green-400/60 text-xs mt-1">
                Höhenprofil: {Array.isArray(fields.elevation_profile) ? (fields.elevation_profile as unknown[]).length : '?'} Datenpunkte
              </p>
            ) : null}
          </div>
        ) : (
          <div className="p-4 bg-zinc-800/30 border border-zinc-800 rounded-lg">
            <p className="text-zinc-500 text-sm">Keine Route vorhanden. Nutze Rescan mit einer Komoot/RideWithGPS URL.</p>
          </div>
        )}
        {fields.last_scanned_at ? (
          <p className="text-xs text-zinc-600">
            Letzter Scan: {new Date(String(fields.last_scanned_at)).toLocaleString('de-DE')}
          </p>
        ) : null}
        {fields.updated_at ? (
          <p className="text-xs text-zinc-600">
            Letzte Änderung: {new Date(String(fields.updated_at)).toLocaleString('de-DE')}
          </p>
        ) : null}
      </div>
    </div>
  )
}

const EDITABLE_FIELDS: { key: string; label: string; type: string }[] = [
  // Basis
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'short_name', label: 'Kurzname', type: 'text' },
  { key: 'slug', label: 'Slug', type: 'text' },
  { key: 'date', label: 'Datum', type: 'date' },
  // Ort
  { key: 'location', label: 'Ort / Start', type: 'text' },
  { key: 'city', label: 'Stadt', type: 'text' },
  { key: 'country', label: 'Land (Kürzel)', type: 'text' },
  // Strecke
  { key: 'distance_km', label: 'Distanz (km)', type: 'number' },
  { key: 'elevation_m', label: 'Höhenmeter gesamt', type: 'number' },
  { key: 'min_elevation_m', label: 'Min. Höhe (m)', type: 'number' },
  { key: 'max_elevation_m', label: 'Max. Höhe (m)', type: 'number' },
  // Kategorien
  { key: 'type', label: 'Typ', type: 'select' },
  { key: 'bike_type', label: 'Rad-Typ', type: 'select' },
  { key: 'difficulty', label: 'Schwierigkeit', type: 'select' },
  { key: 'gradient_class', label: 'Profil', type: 'select' },
  // Teilnahme
  { key: 'participation', label: 'Teilnahme', type: 'select' },
  { key: 'participants', label: 'Teilnehmer (Anzahl)', type: 'number' },
  { key: 'start_time', label: 'Startzeit', type: 'text' },
  // Darstellung
  { key: 'color', label: 'Farbe (Hex)', type: 'color' },
  // URLs
  { key: 'url', label: 'Website', type: 'url' },
  { key: 'event_info_url', label: 'Event-Info URL', type: 'url' },
  { key: 'route_source_url', label: 'Routen-URL', type: 'url' },
  // Freitext
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
