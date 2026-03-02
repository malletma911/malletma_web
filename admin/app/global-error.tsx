'use client'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <html lang="de">
      <body style={{ background: '#0a0a0a', color: '#ededed', fontFamily: 'system-ui', padding: '2rem' }}>
        <h1 style={{ color: '#f87171' }}>Global Error</h1>
        <p>{error.message}</p>
        {error.digest && <p style={{ color: '#71717a', fontSize: '0.875rem' }}>Digest: {error.digest}</p>}
        <pre style={{ marginTop: '1rem', padding: '1rem', background: '#18181b', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#a1a1aa', overflow: 'auto' }}>
          {error.stack}
        </pre>
      </body>
    </html>
  )
}
