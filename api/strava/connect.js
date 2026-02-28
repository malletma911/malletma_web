export const config = { runtime: 'edge' }

export default function handler(request) {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    redirect_uri: `${process.env.AUTH0_BASE_URL}/api/strava/callback`,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
  })
  return Response.redirect(`https://www.strava.com/oauth/authorize?${params}`)
}
