import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const syncSecret = process.env.SYNC_SECRET
  if (syncSecret && authHeader !== `Bearer ${syncSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const path = req.nextUrl.searchParams.get('path') || '/garage'
  revalidatePath(path)

  return NextResponse.json({ revalidated: true, path })
}
