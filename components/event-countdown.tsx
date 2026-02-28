'use client'

import { useEffect, useState } from 'react'

export default function EventCountdown({ date }: { date: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 })

  useEffect(() => {
    function update() {
      const diff = new Date(date).getTime() - Date.now()
      if (diff <= 0) return
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      })
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [date])

  return (
    <div className="flex gap-3">
      {[
        { value: timeLeft.days, label: 'Tage' },
        { value: timeLeft.hours, label: 'Std' },
        { value: timeLeft.minutes, label: 'Min' },
      ].map(({ value, label }) => (
        <div key={label} className="text-center">
          <div className="text-2xl font-bold tabular-nums">{String(value).padStart(2, '0')}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        </div>
      ))}
    </div>
  )
}
