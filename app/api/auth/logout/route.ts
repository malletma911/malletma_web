import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const runtime = 'edge'

export async function GET() {
  const cookieStore = await cookies()
  cookieStore.delete('session')

  const params = new URLSearchParams({
    client_id: process.env.AUTH0_CLIENT_ID!,
    returnTo: process.env.AUTH0_BASE_URL!,
  })
  redirect(`https://${process.env.AUTH0_DOMAIN}/v2/logout?${params}`)
}
