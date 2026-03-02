import { NextRequest, NextResponse } from 'next/server'
import { parseGpx } from '@/lib/parsers/gpx'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('gpx') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No GPX file provided' }, { status: 400 })
  }

  const text = await file.text()

  try {
    const route = parseGpx(text)
    return NextResponse.json(route)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to parse GPX' },
      { status: 400 },
    )
  }
}
