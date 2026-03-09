'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { Bike, BikeStravaStats } from '@/types'
import BikeSlide from './bike-slide'

interface BikeShowcaseProps {
  bikes: Bike[]
  stats: Record<string, BikeStravaStats>
}

export default function BikeShowcase({ bikes, stats }: BikeShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Track active slide via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const slides = container.querySelectorAll<HTMLDivElement>('[data-slide]')
    if (slides.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-slide'))
            if (!isNaN(index)) setActiveIndex(index)
          }
        }
      },
      {
        root: container,
        threshold: 0.6,
      }
    )

    slides.forEach(slide => observer.observe(slide))
    return () => observer.disconnect()
  }, [bikes.length])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' && activeIndex < bikes.length - 1) {
        scrollToIndex(activeIndex + 1)
      } else if (e.key === 'ArrowLeft' && activeIndex > 0) {
        scrollToIndex(activeIndex - 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, bikes.length])

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current
    if (!container) return
    const slide = container.querySelector(`[data-slide="${index}"]`)
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }, [])

  if (bikes.length === 0) return null

  return (
    <div className="relative">
      {/* Swipe container */}
      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {bikes.map((bike, i) => (
          <div key={bike.id} data-slide={i} className="w-full flex-shrink-0 snap-start">
            <BikeSlide bike={bike} stats={stats[bike.id] ?? null} />
          </div>
        ))}
      </div>

      {/* Navigation arrows (desktop only) */}
      {bikes.length > 1 && (
        <>
          {activeIndex > 0 && (
            <button
              onClick={() => scrollToIndex(activeIndex - 1)}
              className="hidden sm:flex absolute left-4 top-1/3 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors z-10"
              aria-label="Vorheriges Bike"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {activeIndex < bikes.length - 1 && (
            <button
              onClick={() => scrollToIndex(activeIndex + 1)}
              className="hidden sm:flex absolute right-4 top-1/3 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors z-10"
              aria-label="Nächstes Bike"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Dot indicators */}
      {bikes.length > 1 && (
        <div className="flex justify-center gap-2 mt-6 pb-4">
          {bikes.map((bike, i) => (
            <button
              key={bike.id}
              onClick={() => scrollToIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'bg-primary w-6'
                  : 'bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Zu ${bike.name} wechseln`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
