import { redirect } from 'next/navigation'

export const runtime = 'edge'

export function GET() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.AUTH0_CLIENT_ID!,
    redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
    scope: 'openid profile email',
    connection: 'github',
  })
  redirect(`https://${process.env.AUTH0_DOMAIN}/authorize?${params}`)
}
