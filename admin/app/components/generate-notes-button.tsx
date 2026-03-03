'use client'

import { useState } from 'react'

export default function GenerateNotesButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ updated: number; failed: number; total: number } | null>(null)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/agent/generate-notes', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        {loading ? 'Generiere...' : 'Beschreibungen generieren'}
      </button>
      {result && (
        <span className="text-xs text-green-400">
          {result.updated}/{result.total} generiert{result.failed > 0 ? ` (${result.failed} Fehler)` : ''}
        </span>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
