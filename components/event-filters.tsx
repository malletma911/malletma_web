'use client'

export interface FilterGroup {
  key: string
  options: { value: string; label: string; count: number }[]
}

export interface FilterState {
  participation: Set<'confirmed' | 'planned'>
  modus:         Set<'training' | 'race' | 'gran_fondo'>
  bikeType:      Set<'road' | 'gravel'>
}

export function defaultFilters(): FilterState {
  return {
    participation: new Set(['confirmed', 'planned']),
    modus:         new Set(['training', 'race', 'gran_fondo']),
    bikeType:      new Set(['road', 'gravel']),
  }
}

interface Props {
  groups: FilterGroup[]
  filters: FilterState
  onChange: (next: FilterState) => void
  totalVisible: number
  totalAll: number
}

export default function EventFilters({ groups, filters, onChange, totalVisible, totalAll }: Props) {
  function toggle(key: string, value: string, allValues: string[]) {
    const current = (filters as unknown as Record<string, Set<string>>)[key]
    const next = new Set(current)
    if (next.has(value)) {
      next.delete(value)
      // Prevent empty set — re-activate all in group
      if (next.size === 0) allValues.forEach(v => next.add(v))
    } else {
      next.add(value)
    }
    onChange({ ...filters, [key]: next })
  }

  const isActive = (key: string, value: string) =>
    ((filters as unknown as Record<string, Set<string>>)[key]?.has(value)) ?? true

  const isFiltering = totalVisible < totalAll

  // Only render groups where more than one option has count > 0
  const visibleGroups = groups.filter(g => g.options.filter(o => o.count > 0).length > 1)

  if (visibleGroups.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {visibleGroups.map((group, gi) => (
          <div key={group.key} className="flex items-center gap-1 flex-shrink-0">
            {gi > 0 && (
              <span className="text-white/15 select-none mx-1.5">·</span>
            )}
            {group.options
              .filter(o => o.count > 0)
              .map(opt => {
                const active = isActive(group.key, opt.value)
                const allValues = group.options.map(o => o.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggle(group.key, opt.value, allValues)}
                    className={[
                      'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 cursor-pointer select-none whitespace-nowrap',
                      active
                        ? 'bg-white/8 text-foreground border-white/12'
                        : 'bg-transparent text-white/25 border-transparent hover:text-white/40 hover:border-white/8',
                    ].join(' ')}
                  >
                    {opt.label}
                    <span className={`ml-1 text-[10px] tabular-nums ${active ? 'text-white/30' : 'text-white/15'}`}>
                      {opt.count}
                    </span>
                  </button>
                )
              })}
          </div>
        ))}

        {isFiltering && (
          <>
            <span className="text-white/15 select-none mx-1.5">·</span>
            <span className="text-[10px] text-primary font-semibold flex-shrink-0 tabular-nums">
              {totalVisible} / {totalAll}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
