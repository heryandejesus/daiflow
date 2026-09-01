import { Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'

function GymCard() {
  return (
    <Link
      to="/gym"
      className="block rounded-card border border-lavender/25 bg-surface p-5 shadow-soft transition-colors hover:border-lavender/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-control bg-lavender/20 text-navy">
          <Dumbbell aria-hidden="true" className="size-6" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-navy">Gym</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Entrenamiento pendiente
          </p>
          <p className="mt-4 text-sm font-semibold text-navy">
            Ver entrenamiento →
          </p>
        </div>
      </div>
    </Link>
  )
}

export default GymCard
