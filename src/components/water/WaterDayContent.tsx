import WaterProgressCard from './WaterProgressCard'
import type { WaterEntry } from '../../hooks/useWaterForDate'

interface WaterDayContentProps {
  entries: WaterEntry[]
  totalMl: number
  dailyGoal: number
  progress: number
  actionError: string | null
  isAdding: boolean
  isUndoing: boolean
  addWater: (amount: number) => Promise<void>
  undoLastEntry: () => Promise<void>
}

function WaterDayContent({
  entries,
  totalMl,
  dailyGoal,
  progress,
  actionError,
  isAdding,
  isUndoing,
  addWater,
  undoLastEntry,
}: WaterDayContentProps) {
  return (
    <>
      {actionError ? (
        <p
          role="alert"
          className="rounded-control border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-medium text-navy"
        >
          {actionError}
        </p>
      ) : null}

      <WaterProgressCard
        totalMl={totalMl}
        dailyGoal={dailyGoal}
        progress={progress}
        canUndo={entries.length > 0}
        isAdding={isAdding}
        isUndoing={isUndoing}
        onAddWater={(amount) => void addWater(amount)}
        onUndo={() => void undoLastEntry()}
      />

      <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-navy">Hoy</h2>

        {entries.length > 0 ? (
          <ul className="mt-4 divide-y divide-border">
            {entries
              .slice()
              .reverse()
              .map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }).format(new Date(entry.occurredAt))}
                  </span>
                  <span className="font-semibold text-navy">
                    +{entry.amount} ml
                  </span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Todavía no registraste agua hoy.
          </p>
        )}
      </section>
    </>
  )
}

export default WaterDayContent
