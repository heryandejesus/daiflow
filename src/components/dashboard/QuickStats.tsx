import { Droplets, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'

interface QuickStatsProps {
  completedMeals: number
  totalMeals: number
  mealProgress: number
  totalWaterMl: number
  waterGoalMl: number
  waterProgress: number
}

function QuickStats({
  completedMeals,
  totalMeals,
  mealProgress,
  totalWaterMl,
  waterGoalMl,
  waterProgress,
}: QuickStatsProps) {
  return (
    <section aria-label="Resumen rápido" className="grid grid-cols-2 gap-3">
      <Link
        to="/comidas"
        aria-label={`Comidas: ${completedMeals} de ${totalMeals} completadas`}
        className="rounded-card border border-coral/20 bg-surface p-4 shadow-soft transition-colors hover:border-coral/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        <div className="flex size-10 items-center justify-center rounded-control bg-coral/15 text-coral">
          <Utensils aria-hidden="true" className="size-5" strokeWidth={2} />
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wider text-muted-foreground">
          COMIDAS
        </p>
        <p className="mt-1 text-xl font-bold text-navy">
          {completedMeals} / {totalMeals}
        </p>
        <p className="text-sm text-muted-foreground">comidas</p>
        <div
          aria-hidden="true"
          className="mt-3 h-2 overflow-hidden rounded-button bg-coral/15"
        >
          <div
            className="h-full rounded-button bg-coral"
            style={{ width: `${mealProgress}%` }}
          />
        </div>
      </Link>

      <Link
        to="/agua"
        aria-label={`Agua: ${totalWaterMl} de ${waterGoalMl} mililitros`}
        className="rounded-card border border-mint/30 bg-surface p-4 shadow-soft transition-colors hover:border-mint/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        <div className="flex size-10 items-center justify-center rounded-control bg-mint/20 text-navy">
          <Droplets aria-hidden="true" className="size-5" strokeWidth={2} />
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wider text-muted-foreground">
          AGUA
        </p>
        <p className="mt-1 text-lg font-bold text-navy">
          {totalWaterMl} / {waterGoalMl} ml
        </p>
        <div
          aria-hidden="true"
          className="mt-3 h-2 overflow-hidden rounded-button bg-mint/20"
        >
          <div
            className="h-full rounded-button bg-mint"
            style={{ width: `${waterProgress}%` }}
          />
        </div>
      </Link>
    </section>
  )
}

export default QuickStats
