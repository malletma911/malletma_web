export const config = { runtime: 'edge' }

export default function handler(request) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.AUTH0_CLIENT_ID,
    redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
    scope: 'openid profile email',
  })
  return Response.redirect(
    `https://${process.env.AUTH0_DOMAIN}/authorize?${params}`
  )
}
