// Decorative SVG map of Northern/Central Europe — shows event start locations
// Pure server component, no external dependencies

interface EventPin {
  lat: number
  lon: number
  color: string
  label: string
  city: string
}

// Viewport: W×H px · lat 42–62 · lon 4–22
const W = 500, H = 480
const LAT_MAX = 62, LAT_MIN = 42, LON_MIN = 4, LON_MAX = 22

function px(lon: number) { return (lon - LON_MIN) / (LON_MAX - LON_MIN) * W }
function py(lat: number) { return (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * H }
function mkPath(coords: [number, number][]) {
  return 'M' + coords.map(([la, lo]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join('L') + 'Z'
}

// Simplified country outlines — decorative, not cartographically precise
const SHAPES: Record<string, [number, number][]> = {
  norway: [
    [57.9, 7.0], [58.0, 6.5], [58.5, 6.0], [59.0, 5.5], [59.5, 5.3],
    [60.4, 5.3], [61.0, 5.3], [62.0, 5.7], [62.0, 12.2],
    [61.5, 12.8], [60.5, 12.5], [60.0, 12.5], [59.5, 11.8],
    [59.0, 11.2], [58.7, 10.5], [58.3, 8.2],
  ],
  germany: [
    [52.4, 6.9], [53.3, 7.0], [53.8, 8.5], [54.5, 9.0],
    [54.8, 9.4], [54.8, 10.0], [54.3, 10.5], [54.0, 10.7],
    [54.1, 11.5], [54.2, 12.2], [54.4, 13.5], [54.0, 14.3],
    [51.6, 14.6], [50.9, 14.1], [50.3, 12.6], [50.0, 12.8],
    [48.8, 13.8], [48.0, 10.5], [48.0, 7.9], [49.0, 7.9],
    [49.5, 6.4], [50.3, 6.1], [51.5, 6.0],
  ],
  jutland: [
    [54.8, 9.4], [55.2, 8.4], [55.6, 8.0], [56.0, 8.1],
    [57.0, 8.2], [57.5, 8.9], [57.7, 10.2], [57.5, 10.6],
    [56.9, 10.4], [56.5, 9.5], [56.2, 9.8], [55.9, 10.5],
    [55.5, 10.3], [55.2, 10.0], [55.0, 9.8], [54.9, 9.5],
    [54.8, 9.6], [54.8, 10.0],
  ],
  funen: [
    [55.3, 10.5], [55.6, 10.3], [55.7, 10.8],
    [55.7, 11.3], [55.5, 11.5], [55.3, 11.0],
  ],
  zealand: [
    [55.2, 11.7], [55.5, 11.5], [55.9, 12.0], [56.0, 12.5],
    [55.9, 12.7], [55.7, 12.6], [55.4, 12.3], [55.2, 12.2],
  ],
  sweden: [
    [55.3, 12.8], [55.6, 14.3], [56.2, 15.6], [57.3, 16.8],
    [58.5, 17.5], [59.3, 18.1], [60.0, 18.0], [61.5, 17.0],
    [62.0, 15.5], [62.0, 12.5], [61.5, 12.8], [60.5, 12.5],
    [60.0, 12.3], [59.5, 11.8], [59.0, 11.2], [58.7, 11.0],
    [58.2, 12.0], [57.7, 11.9], [57.2, 11.7], [56.6, 12.4],
    [56.1, 12.6], [55.8, 12.7], [55.4, 12.8],
  ],
  // Italy — simplified peninsula shape, clipped at lat 42 (southern viewport)
  italy: [
    [47.0, 10.5], [46.5, 13.0], [45.8, 13.8], [45.6, 13.6],
    [44.5, 12.2], [43.8, 12.5], [42.8, 11.8], [42.0, 11.3],
    [42.0, 12.5], [43.0, 13.5], [44.0, 14.2], [43.7, 15.8],
    [42.0, 15.6], [42.0, 10.5],
  ],
  // Switzerland — small alpine block
  switzerland: [
    [47.0, 6.0], [47.7, 7.0], [47.8, 8.6], [47.5, 10.5],
    [46.2, 10.3], [46.0, 8.8], [46.0, 7.0],
  ],
  // Austria — narrow alpine strip
  austria: [
    [48.3, 9.5], [47.8, 10.5], [47.0, 10.5], [47.5, 12.8],
    [47.3, 15.0], [48.0, 17.0], [48.6, 16.9], [48.7, 15.8],
    [48.5, 13.8], [48.8, 13.8], [48.8, 12.5], [48.3, 9.5],
  ],
}

const LAND_FILL   = '#0e1420'
const LAND_STROKE = '#18243a'

// Subtle country labels [lat, lon, text]
const COUNTRY_LABELS: [number, number, string][] = [
  [50.5, 10.5, 'DE'],
  [56.4, 9.1,  'DK'],
  [59.5, 15.8, 'SE'],
  [60.6, 7.2,  'NO'],
  [44.5, 11.5, 'IT'],
]

// Lat grid lines
const LAT_GRID = [45, 50, 55, 60]
const LON_GRID = [5, 10, 15, 20]

export default function EuropeMap({ pins }: { pins: EventPin[] }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#050a14] h-full">
      {/* Label */}
      <p className="absolute top-3 left-4 text-[9px] font-semibold tracking-[0.25em] uppercase text-white/20 z-10 pointer-events-none select-none">
        Event-Standorte · Saison 2026
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        aria-label="Karte Europas mit den Event-Startpunkten"
        role="img"
      >
        {/* Sea background */}
        <rect width={W} height={H} fill="#050a14" />

        {/* Geographic grid */}
        {LAT_GRID.map(lat => (
          <g key={`lat-${lat}`}>
            <line x1={0} y1={py(lat)} x2={W} y2={py(lat)} stroke="#090f1f" strokeWidth="1" />
            <text
              x={W - 5} y={py(lat) - 3}
              textAnchor="end"
              fill="#101928"
              fontSize="8"
              fontFamily="system-ui, sans-serif"
            >{lat}°N</text>
          </g>
        ))}
        {LON_GRID.map(lon => (
          <line key={`lon-${lon}`} x1={px(lon)} y1={0} x2={px(lon)} y2={H} stroke="#090f1f" strokeWidth="1" />
        ))}

        {/* Land masses — in z-order */}
        {(['norway', 'germany', 'switzerland', 'austria', 'italy', 'jutland', 'funen', 'zealand', 'sweden'] as const).map(k => (
          <path
            key={k}
            d={mkPath(SHAPES[k])}
            fill={LAND_FILL}
            stroke={LAND_STROKE}
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        ))}

        {/* Country labels (barely visible, decorative) */}
        {COUNTRY_LABELS.map(([lat, lon, label]) => (
          <text
            key={label}
            x={px(lon)} y={py(lat)}
            textAnchor="middle"
            fill="#1a2a42"
            fontSize="10"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
            letterSpacing="0.1em"
          >{label}</text>
        ))}

        {/* Dashed connector line between pins (in date order) */}
        {pins.length > 1 && (
          <polyline
            points={pins.map(p => `${px(p.lon).toFixed(1)},${py(p.lat).toFixed(1)}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1.5"
            strokeDasharray="3,6"
            strokeLinecap="round"
          />
        )}

        {/* Event pins */}
        {pins.map((pin, i) => {
          const cx = px(pin.lon)
          const cy = py(pin.lat)
          // Push label below pin if near top, above otherwise
          const nearTop = cy < H * 0.22
          const labelY  = nearTop ? cy + 24 : cy - 20
          const cityY   = nearTop ? cy + 33 : cy - 11

          return (
            <g key={i}>
              {/* Glow halos */}
              <circle cx={cx} cy={cy} r={20} fill={pin.color} opacity={0.05} />
              <circle cx={cx} cy={cy} r={11} fill={pin.color} opacity={0.15} />
              {/* Pin dot */}
              <circle cx={cx} cy={cy} r={5}   fill={pin.color} opacity={0.85} />
              <circle cx={cx} cy={cy} r={2.2} fill="white"    opacity={0.9}  />

              {/* Event short name */}
              <text
                x={cx} y={labelY}
                textAnchor="middle"
                fill={pin.color}
                fontSize="9"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.04em"
              >{pin.label}</text>

              {/* City */}
              <text
                x={cx} y={cityY}
                textAnchor="middle"
                fill="rgba(255,255,255,0.35)"
                fontSize="7.5"
                fontFamily="system-ui, sans-serif"
              >{pin.city}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
