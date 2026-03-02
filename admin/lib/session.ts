import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export interface Session {
  email: string
  name: string
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session')?.value
  if (!sessionToken) return null

  const secret = new TextEncoder().encode(process.env.AUTH0_SECRET)
  try {
    const { payload } = await jwtVerify(sessionToken, secret)
    return payload as unknown as Session
  } catch {
    return null
  }
}
