'use client'

export interface FilterState {
  participation: Set<'confirmed' | 'planned'>
  competition: Set<'training' | 'wettbewerb'>
  bikeType: Set<'road' | 'gravel'>
  eventType: Set<'race' | 'gran_fondo'>
}

export function defaultFilters(): FilterState {
  return {
    participation: new Set(['confirmed', 'planned']),
    competition:   new Set(['training', 'wettbewerb']),
    bikeType:      new Set(['road', 'gravel']),
    eventType:     new Set(['race', 'gran_fondo']),
  }
}

type FilterKey = keyof FilterState
type FilterValue<K extends FilterKey> = FilterState[K] extends Set<infer V> ? V : never

const GROUPS: {
  label: string
  key: FilterKey
  options: { value: string; label: string }[]
}[] = [
  {
    label: 'Teilnahme',
    key: 'participation',
    options: [
      { value: 'confirmed', label: 'Dabei' },
      { value: 'planned',   label: 'Geplant' },
    ],
  },
  {
    label: 'Modus',
    key: 'competition',
    options: [
      { value: 'wettbewerb', label: 'Wettbewerb' },
      { value: 'training',   label: 'Training' },
    ],
  },
  {
    label: 'Rad',
    key: 'bikeType',
    options: [
      { value: 'road',   label: 'Rennrad' },
      { value: 'gravel', label: 'Gravel' },
    ],
  },
  {
    label: 'Typ',
    key: 'eventType',
    options: [
      { value: 'gran_fondo', label: 'Gran Fondo' },
      { value: 'race',       label: 'Rennen' },
    ],
  },
]

interface Props {
  filters: FilterState
  onChange: (next: FilterState) => void
  totalVisible: number
  totalAll: number
}

export default function EventFilters({ filters, onChange, totalVisible, totalAll }: Props) {
  function toggle<K extends FilterKey>(key: K, value: FilterValue<K>) {
    const current = filters[key] as Set<FilterValue<K>>
    const next = new Set(current)
    if (next.has(value)) {
      next.delete(value)
      // Prevent empty set — re-activate all in group
      if (next.size === 0) {
        const group = GROUPS.find(g => g.key === key)!
        group.options.forEach(o => next.add(o.value as FilterValue<K>))
      }
    } else {
      next.add(value)
    }
    onChange({ ...filters, [key]: next })
  }

  const isActive = (key: FilterKey, value: string): boolean =>
    (filters[key] as Set<string>).has(value)

  const isFiltering = totalVisible < totalAll

  return (
    <div className="mb-6">
      {/* Filter bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {/* Label */}
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground flex-shrink-0 mr-1">
          Filter
        </span>
        <div className="w-px h-4 bg-border flex-shrink-0" />

        {GROUPS.map((group, gi) => (
          <div key={group.key} className="flex items-center gap-1 flex-shrink-0">
            {/* Group separator (except first) */}
            {gi > 0 && <div className="w-px h-4 bg-border mx-0.5" />}

            {/* Group label — tiny, muted */}
            <span className="text-[9px] uppercase tracking-wider text-white/20 mr-0.5 hidden sm:inline">
              {group.label}
            </span>

            {/* Chips */}
            {group.options.map(opt => {
              const active = isActive(group.key, opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(group.key as FilterKey, opt.value as FilterValue<typeof group.key>)}
                  className={[
                    'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 cursor-pointer select-none whitespace-nowrap',
                    active
                      ? 'bg-white/8 text-foreground border-white/12'
                      : 'bg-transparent text-white/25 border-transparent hover:text-white/40 hover:border-white/8',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        ))}

        {/* Active indicator */}
        {isFiltering && (
          <>
            <div className="w-px h-4 bg-border flex-shrink-0 mx-0.5" />
            <span className="text-[10px] text-primary font-semibold flex-shrink-0">
              {totalVisible} / {totalAll}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
