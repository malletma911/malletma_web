import Anthropic from '@anthropic-ai/sdk'
import * as cheerio from 'cheerio'
import { extractRouteFromUrl } from '../parsers/route-extractor'
import { parseGpx, ParsedRoute } from '../parsers/gpx'

const SYSTEM_PROMPT = `Du bist ein Assistent für das Radevent-Dashboard von malletma.de.
Deine Aufgabe: Aus URLs und/oder GPX-Daten alle relevanten Informationen über ein Radevent extrahieren.

Du hast 3 Tools:
- scrape_webpage: Lade eine Webseite und extrahiere Textinhalt
- extract_route_from_url: Extrahiere GPS-Route aus einer URL (Komoot, RideWithGPS, GPX)
- parse_gpx: Parse GPX-XML-Daten direkt

Extrahiere folgende Felder (alle optional):
- name: Offizieller Event-Name
- short_name: Kurzname (z.B. "MSR" für Mailand-Sanremo)
- date: Datum im Format YYYY-MM-DD
- location: Startort
- city: Stadt
- country: Länderkürzel (DE, AT, IT, SE, FR, etc.)
- distance_km: Distanz in km
- elevation_m: Gesamthöhenmeter
- type: "race" | "granfondo" | "charity" | "training"
- bike_type: "road" | "gravel" | "mtb"
- participants: Teilnehmerzahl (geschätzt)
- start_time: Startzeit (z.B. "07:00")
- gradient_class: "flat" | "hilly" | "mountainous"
- url: Offizielle Website-URL
- slug: URL-freundlicher Name (lowercase, dashes)
- notes: Beschreibung des Events (max. 350 Zeichen, auf Deutsch). Beschreibe Strecke, Besonderheiten und Charakter des Events. Nutze die Event-Website als Quelle. IMMER ausfüllen!

Antworte IMMER mit einem JSON-Objekt. Felder die du nicht ermitteln kannst, lasse weg.
Nutze die Tools um Informationen zu sammeln. Sei gründlich aber effizient.`

interface AgentResult {
  fields: Record<string, unknown>
  route?: ParsedRoute
  toolCalls: string[]
}

export async function runEventAgent(opts: {
  eventInfoUrl?: string
  routeSourceUrl?: string
  gpxContent?: string
}): Promise<AgentResult> {
  const client = new Anthropic()
  const toolCalls: string[] = []

  const tools: Anthropic.Messages.Tool[] = [
    {
      name: 'scrape_webpage',
      description: 'Fetch a webpage and return its text content (HTML stripped)',
      input_schema: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'The URL to scrape' },
        },
        required: ['url'],
      },
    },
    {
      name: 'extract_route_from_url',
      description: 'Extract GPS route data from a URL (Komoot, RideWithGPS, GPX)',
      input_schema: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'The route URL' },
        },
        required: ['url'],
      },
    },
    {
      name: 'parse_gpx',
      description: 'Parse GPX XML content into route data',
      input_schema: {
        type: 'object' as const,
        properties: {
          gpx_content: { type: 'string', description: 'The GPX XML content' },
        },
        required: ['gpx_content'],
      },
    },
  ]

  // Build initial prompt
  const parts: string[] = []
  if (opts.eventInfoUrl) parts.push(`Event-Info URL: ${opts.eventInfoUrl}`)
  if (opts.routeSourceUrl) parts.push(`Routen-URL: ${opts.routeSourceUrl}`)
  if (opts.gpxContent) parts.push(`GPX-Daten wurden bereitgestellt (nutze parse_gpx).`)
  parts.push('Bitte extrahiere alle verfügbaren Informationen über dieses Radevent.')

  const messages: Anthropic.Messages.MessageParam[] = [
    { role: 'user', content: parts.join('\n') },
  ]

  let route: ParsedRoute | undefined
  let maxTurns = 8

  while (maxTurns-- > 0) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    })

    // Collect assistant content
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      // Extract JSON from final response
      const textBlock = response.content.find(b => b.type === 'text')
      if (textBlock && textBlock.type === 'text') {
        const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const fields = JSON.parse(jsonMatch[0])
            return { fields, route, toolCalls }
          } catch {
            return { fields: {}, route, toolCalls }
          }
        }
      }
      return { fields: {}, route, toolCalls }
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        toolCalls.push(block.name)
        const input = block.input as Record<string, string>

        try {
          let result: string

          if (block.name === 'scrape_webpage') {
            const res = await fetch(input.url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MalletmaBot/1.0)' },
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const html = await res.text()
            const $ = cheerio.load(html)
            $('script, style, nav, footer, header').remove()
            result = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000)
          } else if (block.name === 'extract_route_from_url') {
            const parsed = await extractRouteFromUrl(input.url)
            if (parsed) {
              route = parsed
              result = JSON.stringify({
                distance_km: parsed.distance_km,
                elevation_m: parsed.elevation_m,
                min_elevation_m: parsed.min_elevation_m,
                max_elevation_m: parsed.max_elevation_m,
                point_count: parsed.polyline.length,
              })
            } else {
              result = 'Could not extract route from this URL'
            }
          } else if (block.name === 'parse_gpx') {
            const gpxData = input.gpx_content || opts.gpxContent || ''
            const parsed = parseGpx(gpxData)
            route = parsed
            result = JSON.stringify({
              distance_km: parsed.distance_km,
              elevation_m: parsed.elevation_m,
              min_elevation_m: parsed.min_elevation_m,
              max_elevation_m: parsed.max_elevation_m,
              point_count: parsed.polyline.length,
            })
          } else {
            result = 'Unknown tool'
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          })
        } catch (e) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Error: ${e instanceof Error ? e.message : String(e)}`,
            is_error: true,
          })
        }
      }

      messages.push({ role: 'user', content: toolResults })
    }
  }

  return { fields: {}, route, toolCalls }
}
