export const config = { runtime: 'edge' }

export default function handler() {
  const params = new URLSearchParams({
    client_id: process.env.AUTH0_CLIENT_ID,
    returnTo: process.env.AUTH0_BASE_URL,
  })
  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://${process.env.AUTH0_DOMAIN}/v2/logout?${params}`,
      'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    },
  })
}
