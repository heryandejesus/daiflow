interface GymSessionProgressProps {
  completedSets: number
  totalSets: number
  progress: number
  isFinishing: boolean
  finishDisabled: boolean
  onRequestFinish: () => void
}

function GymSessionProgress({
  completedSets,
  totalSets,
  progress,
  isFinishing,
  finishDisabled,
  onRequestFinish,
}: GymSessionProgressProps) {
  return (
    <section className="rounded-card border border-lavender/30 bg-lavender/10 p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy">
            Entrenamiento en curso
          </p>
          <p className="mt-2 text-lg font-semibold text-navy">
            {completedSets} de {totalSets} series
          </p>
        </div>
        <p className="text-2xl font-bold text-navy">{progress}%</p>
      </div>

      <div
        role="progressbar"
        aria-label="Progreso del entrenamiento"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="mt-4 h-3 overflow-hidden rounded-button bg-border/60"
      >
        <div
          className="h-full rounded-button bg-lavender"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        type="button"
        disabled={finishDisabled}
        onClick={onRequestFinish}
        className="mt-5 min-h-11 w-full rounded-button bg-navy px-5 py-3 text-sm font-semibold text-surface transition-colors hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-55"
      >
        {isFinishing ? 'Finalizando…' : 'Finalizar entrenamiento'}
      </button>
    </section>
  )
}

export default GymSessionProgress
