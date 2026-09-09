export interface WeeklyProgressDay {
  dateString: string
  shortLabel: string
  fullLabel: string
  progress: number | null
  isToday: boolean
  isFuture: boolean
}

interface WeeklyProgressChartProps {
  days: WeeklyProgressDay[]
  onDaySelect?: (dateString: string) => void
}

function WeeklyProgressChart({ days, onDaySelect }: WeeklyProgressChartProps) {
  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-navy">Progreso diario</h2>

      <ul className="mt-5 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const accessibleLabel = day.isFuture
            ? `${day.fullLabel}: día futuro`
            : `${day.fullLabel}: ${day.progress ?? 0}% de progreso`

          return (
            <li
              key={day.dateString}
              aria-label={accessibleLabel}
              className="flex min-w-0 flex-col items-center"
            >
              <span className="h-5 text-[0.625rem] font-semibold text-muted-foreground">
                {day.isFuture ? '' : `${day.progress ?? 0}%`}
              </span>

              <button
                type="button"
                disabled={day.isFuture || !onDaySelect}
                aria-label={`${accessibleLabel}. Abrir detalle`}
                onClick={() => onDaySelect?.(day.dateString)}
                className="mt-2 flex h-28 w-full max-w-8 items-end overflow-hidden rounded-button bg-border/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-default"
              >
                {!day.isFuture ? (
                  <span
                    aria-hidden="true"
                    className={`w-full rounded-button ${
                      day.isToday ? 'bg-lavender' : 'bg-mint'
                    }`}
                    style={{ height: `${day.progress ?? 0}%` }}
                  />
                ) : null}
              </button>

              <span
                className={`mt-2 flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                  day.isToday
                    ? 'bg-navy text-surface'
                    : day.isFuture
                      ? 'text-muted-foreground/60'
                      : 'text-navy'
                }`}
              >
                {day.shortLabel}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default WeeklyProgressChart
