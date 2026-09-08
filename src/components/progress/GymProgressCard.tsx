import { Dumbbell } from 'lucide-react'

export interface LatestGymSessionSummary {
  workoutTitle: string
  completedSets: number
  totalSets: number
  progress: number
}

interface GymProgressCardProps {
  isCurrentWeek?: boolean
  completedSessions: number
  completedSets: number
  possibleSets: number
  progress: number | null
  activeSessionCount: number
  latestSession: LatestGymSessionSummary | null
}

function getSessionLabel(count: number) {
  return count === 1 ? 'entrenamiento' : 'entrenamientos'
}

function GymProgressCard({
  isCurrentWeek = true,
  completedSessions,
  completedSets,
  possibleSets,
  progress,
  activeSessionCount,
  latestSession,
}: GymProgressCardProps) {
  const hasCompletedSessions = completedSessions > 0 && progress !== null

  return (
    <section className="rounded-card border border-lavender/30 bg-surface p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-control bg-lavender/20 text-navy">
          <Dumbbell aria-hidden="true" className="size-5.5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-navy">Gym</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isCurrentWeek ? 'Esta semana' : 'Semana seleccionada'}
          </p>
        </div>
        {hasCompletedSessions ? (
          <p className="text-2xl font-bold tracking-tight text-navy">
            {progress}%
          </p>
        ) : null}
      </div>

      {hasCompletedSessions ? (
        <>
          <p className="mt-5 text-xl font-bold text-navy">
            {completedSessions} {getSessionLabel(completedSessions)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {completedSets} de {possibleSets} series realizadas
          </p>
          <div
            role="progressbar"
            aria-label="Progreso semanal de series de Gym"
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

          {latestSession ? (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Último entrenamiento
              </p>
              <p className="mt-2 font-semibold text-navy">
                {latestSession.workoutTitle}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {latestSession.completedSets} de {latestSession.totalSets}{' '}
                series · {latestSession.progress}%
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          {isCurrentWeek
            ? 'Todavía no registraste entrenamientos esta semana.'
            : 'No hay entrenamientos finalizados en esta semana.'}
        </p>
      )}

      {activeSessionCount > 0 ? (
        <p className="mt-4 rounded-control bg-lavender/10 px-3 py-2.5 text-sm font-medium text-navy">
          {hasCompletedSessions
            ? `${activeSessionCount} ${getSessionLabel(activeSessionCount)} en curso`
            : activeSessionCount === 1
              ? 'Tenés un entrenamiento en curso.'
              : `Tenés ${activeSessionCount} entrenamientos en curso.`}
        </p>
      ) : null}
    </section>
  )
}

export default GymProgressCard
