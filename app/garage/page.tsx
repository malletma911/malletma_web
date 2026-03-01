export const dynamic = 'force-dynamic'

import { getSupabase } from '@/lib/supabase'
import { Bike } from '@/types'
import Image from 'next/image'

async function getBikes(): Promise<Bike[]> {
  const supabase = getSupabase()
  const { data } = await supabase.from('bikes').select('*').order('created_at', { ascending: false })
  return data ?? []
}

const typeLabels: Record<string, string> = {
  road: 'Rennrad',
  gravel: 'Gravel',
  mtb: 'MTB',
  tt: 'Zeitfahren',
}

export default async function GaragePage() {
  const bikes = await getBikes()

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <p className="text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-3">Meine Bikes</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-6xl md:text-8xl tracking-wider">GARAGE</h1>
        </div>

        {bikes.length === 0 ? (
          <div className="text-center py-32 text-muted-foreground">
            <p className="text-6xl mb-6">🚲</p>
            <p className="text-xl">Noch keine Fahrräder eingetragen.</p>
            <p className="text-sm mt-2">Füge deine Bikes in der Supabase-Datenbank hinzu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bikes.map(bike => (
              <div key={bike.id} className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all">
                {bike.photo_url ? (
                  <div className="relative aspect-[4/3] bg-muted">
                    <Image src={bike.photo_url} alt={bike.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-muted flex items-center justify-center text-6xl">🚲</div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h2 className="text-xl font-bold">{bike.name}</h2>
                      {bike.brand && <p className="text-muted-foreground text-sm">{bike.brand}</p>}
                    </div>
                    {bike.type && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {typeLabels[bike.type] ?? bike.type}
                      </span>
                    )}
                  </div>
                  {bike.description && <p className="text-muted-foreground text-sm mt-3">{bike.description}</p>}
                  <div className="flex gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                    {bike.weight_kg && <span>{bike.weight_kg} kg</span>}
                    {bike.year && <span>{bike.year}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
