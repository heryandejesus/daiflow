import { Droplets, Utensils } from 'lucide-react'

interface WeeklySummaryCardsProps {
  completedMeals: number
  possibleMeals: number
  averageMealProgress: number
  waterGoalDays: number
  elapsedDays: number
  averageWaterProgress: number
}

function WeeklySummaryCards({
  completedMeals,
  possibleMeals,
  averageMealProgress,
  waterGoalDays,
  elapsedDays,
  averageWaterProgress,
}: WeeklySummaryCardsProps) {
  return (
    <section aria-label="Resumen semanal" className="grid grid-cols-2 gap-3">
      <article className="rounded-card border border-coral/20 bg-surface p-4 shadow-soft">
        <div className="flex size-10 items-center justify-center rounded-control bg-coral/15 text-coral">
          <Utensils aria-hidden="true" className="size-5" strokeWidth={2} />
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wider text-muted-foreground">
          COMIDAS
        </p>
        <p className="mt-1 text-xl font-bold text-navy">
          {completedMeals} de {possibleMeals}
        </p>
        <p className="text-sm leading-5 text-muted-foreground">
          comidas completadas
        </p>
        <p className="mt-3 text-xs font-semibold text-navy">
          Promedio {averageMealProgress}%
        </p>
      </article>

      <article className="rounded-card border border-mint/30 bg-surface p-4 shadow-soft">
        <div className="flex size-10 items-center justify-center rounded-control bg-mint/20 text-navy">
          <Droplets aria-hidden="true" className="size-5" strokeWidth={2} />
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wider text-muted-foreground">
          AGUA
        </p>
        <p className="mt-1 text-xl font-bold text-navy">
          {waterGoalDays} de {elapsedDays}
        </p>
        <p className="text-sm leading-5 text-muted-foreground">
          días con meta cumplida
        </p>
        <p className="mt-3 text-xs font-semibold text-navy">
          Promedio {averageWaterProgress}%
        </p>
      </article>
    </section>
  )
}

export default WeeklySummaryCards
