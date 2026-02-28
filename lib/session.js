import { jwtVerify } from 'jose'

export async function getSession(req) {
  const cookieHeader = req.headers['cookie'] || ''
  const sessionCookie = cookieHeader.split(';').find(c => c.trim().startsWith('session='))
  if (!sessionCookie) return null

  const sessionToken = sessionCookie.trim().slice('session='.length)
  const secret = new TextEncoder().encode(process.env.AUTH0_SECRET)

  try {
    const { payload } = await jwtVerify(sessionToken, secret)
    return payload
  } catch {
    return null
  }
}
