import { Droplets } from 'lucide-react'

interface WaterProgressCardProps {
  totalMl: number
  dailyGoal: number
  progress: number
  canUndo: boolean
  isAdding: boolean
  isUndoing: boolean
  onAddWater: (amount: number) => void
  onUndo: () => void
}

function WaterProgressCard({
  totalMl,
  dailyGoal,
  progress,
  canUndo,
  isAdding,
  isUndoing,
  onAddWater,
  onUndo,
}: WaterProgressCardProps) {
  const isMutating = isAdding || isUndoing

  return (
    <section className="rounded-card border border-mint/30 bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-control bg-mint/20 text-navy">
          <Droplets aria-hidden="true" className="size-6" strokeWidth={2} />
        </div>
        <p className="text-3xl font-bold tracking-tight text-navy">
          {progress}%
        </p>
      </div>

      <div className="mt-5">
        <p className="text-2xl font-bold tracking-tight text-navy">
          {totalMl} / {dailyGoal} ml
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Meta diaria</p>
      </div>

      <div
        role="progressbar"
        aria-label="Progreso de hidratación diario"
        aria-valuemin={0}
        aria-valuemax={dailyGoal}
        aria-valuenow={Math.min(totalMl, dailyGoal)}
        aria-valuetext={`${totalMl} ml de ${dailyGoal} ml`}
        className="mt-5 h-3 overflow-hidden rounded-button bg-mint/20"
      >
        <div
          className="h-full rounded-button bg-mint"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onAddWater(250)}
          disabled={isMutating}
          className="min-h-12 rounded-button bg-mint px-4 py-3 text-sm font-semibold text-navy transition-colors hover:bg-mint/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60"
        >
          +250 ml
        </button>
        <button
          type="button"
          onClick={() => onAddWater(500)}
          disabled={isMutating}
          className="min-h-12 rounded-button bg-navy px-4 py-3 text-sm font-semibold text-surface transition-colors hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60"
        >
          +500 ml
        </button>
      </div>

      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo || isMutating}
        className="mt-3 min-h-12 w-full rounded-button px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-background hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
      >
        {isUndoing ? 'Deshaciendo…' : 'Deshacer última carga'}
      </button>

      {isAdding ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-2 text-center text-xs text-muted-foreground"
        >
          Guardando…
        </p>
      ) : null}
    </section>
  )
}

export default WaterProgressCard
