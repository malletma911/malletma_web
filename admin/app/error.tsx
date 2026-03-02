'use client'

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold text-red-400 mb-4">Server Error</h1>
      <p className="text-zinc-400 mb-2">{error.message}</p>
      {error.digest && (
        <p className="text-zinc-600 text-sm font-mono">Digest: {error.digest}</p>
      )}
      <pre className="mt-6 text-left max-w-2xl mx-auto p-4 bg-zinc-900 rounded-lg text-xs text-zinc-500 overflow-auto">
        {error.stack}
      </pre>
    </div>
  )
}
