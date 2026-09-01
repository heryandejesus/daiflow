interface DailyProgressCardProps {
  progress: number
}

function DailyProgressCard({ progress }: DailyProgressCardProps) {
  return (
    <section className="rounded-card border border-border bg-mint/10 p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy">
            Tu día
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comidas e hidratación
          </p>
        </div>
        <p className="text-3xl font-bold tracking-tight text-navy">
          {progress}%
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Progreso diario de comidas e hidratación"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="mt-5 h-3 overflow-hidden rounded-button bg-mint/20"
      >
        <div
          className="h-full rounded-button bg-mint"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  )
}

export default DailyProgressCard
