import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeeklyPeriodNavigatorProps {
  rangeLabel: string
  isCurrentWeek: boolean
  canGoPrevious: boolean
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
  onReturnToCurrent: () => void
}

function WeeklyPeriodNavigator({
  rangeLabel,
  isCurrentWeek,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onReturnToCurrent,
}: WeeklyPeriodNavigatorProps) {
  const arrowClassName = 'flex size-11 items-center justify-center rounded-button text-navy transition-colors hover:bg-mint/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-35'

  return (
    <nav aria-label="Navegación semanal" className="rounded-card border border-border bg-surface px-2 py-2 shadow-soft">
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-1">
        <button type="button" aria-label="Semana anterior" disabled={!canGoPrevious} onClick={onPrevious} className={arrowClassName}>
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <p aria-live="polite" aria-atomic="true" className="text-center text-sm font-semibold leading-5 text-navy">
          {rangeLabel}
        </p>
        <button type="button" aria-label="Semana siguiente" disabled={!canGoNext} onClick={onNext} className={arrowClassName}>
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="flex min-h-11 items-center justify-center">
        {isCurrentWeek ? (
          <p className="text-xs font-medium text-muted-foreground">Semana actual</p>
        ) : (
          <button type="button" onClick={onReturnToCurrent} className="min-h-11 rounded-button px-3 text-xs font-semibold text-navy transition-colors hover:bg-mint/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
            Volver a esta semana
          </button>
        )}
      </div>
    </nav>
  )
}

export default WeeklyPeriodNavigator
