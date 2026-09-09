import type { GymHistorySession } from '../../hooks/useGymHistoryForDate'
import { getHistoryExercise } from '../../hooks/useGymHistoryForDate'
import { Link } from 'react-router-dom'

interface GymDayHistoryProps { sessions: GymHistorySession[]; activeSession: boolean }

function GymDayHistory({ sessions, activeSession }: GymDayHistoryProps) {
  return (
    <section className="rounded-card border border-lavender/30 bg-surface p-5 shadow-card">
      <h2 className="text-lg font-semibold text-navy">Gym</h2>
      {activeSession ? <p className="mt-3 rounded-control bg-lavender/10 px-3 py-2 text-sm font-medium text-navy">Tenés un entrenamiento activo de este día. <Link to="/gym" className="underline underline-offset-2">Ir al Gym</Link></p> : null}
      {sessions.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No hay entrenamientos finalizados para este día.</p> : null}
      <div className="mt-4 space-y-4">
        {sessions.map((session) => {
          const possible = session.workout.exercises.reduce((total, exercise) => total + exercise.sets, 0)
          const completed = session.sets.filter((set) => set.completed && getHistoryExercise(session.workout, set.exerciseId)).length
          const progress = possible > 0 ? Math.round((completed / possible) * 100) : 0
          return <article key={session.id} className="rounded-control border border-border p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-navy">{session.workout.title}</h3><p className="mt-1 text-sm text-muted-foreground">Finalizada · {completed} de {possible} series · {progress}%</p></div></div>
            <ul className="mt-4 space-y-3">{session.workout.exercises.map((exercise) => { const sets = session.sets.filter((set) => set.exerciseId === exercise.id).sort((a,b) => a.setNumber-b.setNumber); if (sets.length === 0) return null; return <li key={exercise.id}><p className="text-sm font-semibold text-navy">{exercise.name}</p><ul className="mt-1 space-y-1 text-sm text-muted-foreground">{sets.map((set) => <li key={set.id}>Serie {set.setNumber}: {set.repsCompleted ?? '—'} reps{set.weightKg === null ? '' : ` · ${set.weightKg} kg`}{set.loadNote ? ` · ${set.loadNote}` : ''} · {set.completed ? 'completada' : 'pendiente'}</li>)}</ul></li> })}</ul>
          </article>
        })}
      </div>
    </section>
  )
}
export default GymDayHistory
