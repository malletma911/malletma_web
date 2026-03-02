import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface ScanLog {
  id: string
  scan_type: string
  input_urls: Record<string, unknown> | null
  result: Record<string, unknown> | null
  diff_summary: string | null
  applied: boolean
  created_at: string
}

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = getSupabase()

  const { data: event } = await supabase
    .from('events')
    .select('name')
    .eq('id', id)
    .single()

  const { data: logs } = await supabase
    .from('agent_scan_log')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  const items = (logs ?? []) as ScanLog[]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Scan-Historie</h1>
      <p className="text-zinc-500 mb-8">{event?.name ?? id}</p>

      {items.length === 0 ? (
        <p className="text-zinc-500 py-12 text-center">Keine Scans vorhanden.</p>
      ) : (
        <div className="space-y-4">
          {items.map(log => (
            <div key={log.id} className="border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${
                    log.scan_type === 'initial'
                      ? 'bg-blue-900/30 text-blue-400 border-blue-800/50'
                      : log.scan_type === 'rescan'
                      ? 'bg-purple-900/30 text-purple-400 border-purple-800/50'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {log.scan_type}
                  </span>
                  {log.applied && (
                    <span className="text-xs text-green-400">angewendet</span>
                  )}
                </div>
                <span className="text-xs text-zinc-600">
                  {new Date(log.created_at).toLocaleString('de-DE')}
                </span>
              </div>

              {log.diff_summary && (
                <p className="text-sm text-zinc-400 mb-2">{log.diff_summary}</p>
              )}

              {log.input_urls && (
                <div className="text-xs text-zinc-600 font-mono">
                  {Object.entries(log.input_urls).map(([k, v]) => (
                    <span key={k} className="mr-4">{k}: {String(v)}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
