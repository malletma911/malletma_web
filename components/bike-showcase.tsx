'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Bike, BikeStravaStats } from '@/types'
import BikeSlide from './bike-slide'

interface BikeShowcaseProps {
  bikes: Bike[]
  stats: Record<string, BikeStravaStats>
  allStats: Record<string, BikeStravaStats>
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export default function BikeShowcase({ bikes, stats, allStats }: BikeShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const isDesktop = useIsDesktop()

  // Track active slide via IntersectionObserver (mobile only)
  useEffect(() => {
    if (isDesktop) return
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
      { root: container, threshold: 0.6 }
    )

    slides.forEach(slide => observer.observe(slide))
    return () => observer.disconnect()
  }, [bikes.length, isDesktop])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' && activeIndex < bikes.length - 1) {
        if (isDesktop) {
          setActiveIndex(activeIndex + 1)
        } else {
          scrollToIndex(activeIndex + 1)
        }
      } else if (e.key === 'ArrowLeft' && activeIndex > 0) {
        if (isDesktop) {
          setActiveIndex(activeIndex - 1)
        } else {
          scrollToIndex(activeIndex - 1)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, bikes.length, isDesktop])

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current
    if (!container) return
    const slide = container.querySelector(`[data-slide="${index}"]`)
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }, [])

  if (bikes.length === 0) return null

  const activeBike = bikes[activeIndex]

  // Desktop: Tab-based navigation
  if (isDesktop) {
    return (
      <div className="relative">
        {/* Tab Bar */}
        {bikes.length > 1 && (
          <div className="flex justify-center gap-1 mb-8">
            {bikes.map((bike, i) => {
              const bikeColor = bike.color || '#a1a1aa'
              const isActive = i === activeIndex
              return (
                <button
                  key={bike.id}
                  onClick={() => setActiveIndex(i)}
                  className="relative px-5 py-3 transition-colors rounded-lg"
                  style={{ color: isActive ? bikeColor : undefined }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 transition-transform duration-300"
                      style={{
                        backgroundColor: bikeColor,
                        transform: isActive ? 'scale(1.3)' : 'scale(1)',
                        opacity: isActive ? 1 : 0.4,
                      }}
                    />
                    <span className={`font-[family-name:var(--font-bebas)] text-lg tracking-wider transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}>
                      {bike.name}
                    </span>
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ backgroundColor: bikeColor }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Crossfade content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBike.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <BikeSlide
              bike={activeBike}
              stats={stats[activeBike.id] ?? null}
              allStats={allStats}
              animateOnMount
            />
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // Mobile: Swipe container
  return (
    <div className="relative">
      {/* Dot indicators — sticky so always visible */}
      {bikes.length > 1 && (
        <div className="sticky top-16 z-10 flex justify-center gap-2 py-3 bg-background/80 backdrop-blur-sm">
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

      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {bikes.map((bike, i) => (
          <div key={bike.id} data-slide={i} className="w-full flex-shrink-0 snap-start">
            <BikeSlide bike={bike} stats={stats[bike.id] ?? null} allStats={allStats} />
          </div>
        ))}
      </div>
    </div>
  )
}
