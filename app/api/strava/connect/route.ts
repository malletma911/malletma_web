import { redirect } from 'next/navigation'

export const runtime = 'edge'

export function GET() {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${process.env.AUTH0_BASE_URL}/api/strava/callback`,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
  })
  redirect(`https://www.strava.com/oauth/authorize?${params}`)
}
