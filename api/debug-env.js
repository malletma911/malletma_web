export const config = { runtime: 'edge' }

export default function handler() {
  return new Response(JSON.stringify({
    strava_client_id_set: !!process.env.STRAVA_CLIENT_ID,
    strava_client_id_length: process.env.STRAVA_CLIENT_ID?.length ?? 0,
    strava_client_id_value: process.env.STRAVA_CLIENT_ID ?? 'NICHT GESETZT',
    strava_client_secret_set: !!process.env.STRAVA_CLIENT_SECRET,
    strava_client_secret_length: process.env.STRAVA_CLIENT_SECRET?.length ?? 0,
    strava_client_secret_last3: process.env.STRAVA_CLIENT_SECRET?.slice(-3) ?? 'NICHT GESETZT',
  }), { headers: { 'content-type': 'application/json' } })
}
