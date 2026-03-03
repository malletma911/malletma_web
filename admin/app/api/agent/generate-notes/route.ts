import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import * as cheerio from 'cheerio'
import { getSupabase } from '@/lib/supabase'

const PROMPT = `Du bist ein Assistent für das Radevent-Dashboard von malletma.de.
Schreibe eine kurze, packende Beschreibung für das folgende Radevent.
Max. 350 Zeichen. Auf Deutsch. Beschreibe Strecke, Besonderheiten und Charakter.
Antworte NUR mit dem Beschreibungstext, ohne Anführungszeichen oder Erklärungen.`

export async function POST() {
  const supabase = getSupabase()
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY nicht konfiguriert' }, { status: 400 })
  }

  // Find all published events without notes
  const { data: events, error } = await supabase
    .from('events')
    .select('id, name, date, location, city, country, distance_km, elevation_m, type, bike_type, url, event_info_url, notes')
    .or('status.eq.published,status.eq.active')
    .order('date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const needNotes = (events ?? []).filter((e: Record<string, unknown>) => !e.notes || (e.notes as string).trim().length === 0)

  if (needNotes.length === 0) {
    return NextResponse.json({ updated: 0, message: 'Alle Events haben bereits Beschreibungen.' })
  }

  const client = new Anthropic()
  const results: { id: string; name: string; notes: string }[] = []
  const errors: { id: string; name: string; error: string }[] = []

  for (const event of needNotes) {
    try {
      // Try to scrape the event website for context
      let websiteContext = ''
      const infoUrl = (event.event_info_url || event.url) as string | null
      if (infoUrl) {
        try {
          const res = await fetch(infoUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MalletmaBot/1.0)' },
            signal: AbortSignal.timeout(8000),
          })
          if (res.ok) {
            const html = await res.text()
            const $ = cheerio.load(html)
            $('script, style, nav, footer, header').remove()
            websiteContext = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 4000)
          }
        } catch {
          // Ignore fetch errors, generate from metadata only
        }
      }

      const eventInfo = [
        `Name: ${event.name}`,
        event.date ? `Datum: ${event.date}` : null,
        event.location ? `Ort: ${event.location}` : null,
        event.city ? `Stadt: ${event.city}` : null,
        event.country ? `Land: ${event.country}` : null,
        event.distance_km ? `Distanz: ${event.distance_km} km` : null,
        event.elevation_m ? `Höhenmeter: ${event.elevation_m}` : null,
        event.type ? `Typ: ${event.type}` : null,
        event.bike_type ? `Rad: ${event.bike_type}` : null,
        websiteContext ? `\nWebsite-Inhalt:\n${websiteContext}` : null,
      ].filter(Boolean).join('\n')

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: PROMPT,
        messages: [{ role: 'user', content: eventInfo }],
      })

      const text = response.content.find(b => b.type === 'text')
      if (text && text.type === 'text') {
        const notes = text.text.trim().slice(0, 350)

        await supabase
          .from('events')
          .update({ notes })
          .eq('id', event.id)

        results.push({ id: event.id as string, name: event.name as string, notes })
      }
    } catch (e) {
      errors.push({
        id: event.id as string,
        name: event.name as string,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return NextResponse.json({
    updated: results.length,
    failed: errors.length,
    total: needNotes.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  })
}
