export const config = { runtime: 'edge' }

export default function handler() {
  return new Response(JSON.stringify({
    strava_client_id_set: !!process.env.STRAVA_CLIENT_ID,
    strava_client_id_length: process.env.STRAVA_CLIENT_ID?.length ?? 0,
    strava_client_id_value: process.env.STRAVA_CLIENT_ID ?? 'NICHT GESETZT',
  }), { headers: { 'content-type': 'application/json' } })
}
