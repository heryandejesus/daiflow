import type { GymExercise } from '../../data/gymPlan'
import GymSetRow from './GymSetRow'

export interface GymSetView {
  setNumber: number
  repsCompleted: string
  weightKg: string
  loadNote: string
  completed: boolean
  logId: string | null
  error: string | null
}

interface GymExerciseCardProps {
  exercise: GymExercise
  sets?: GymSetView[]
  isSetSaving?: (setNumber: number) => boolean
  isSetDirty?: (setNumber: number) => boolean
  onChangeSet?: (
    setNumber: number,
    field: 'repsCompleted' | 'weightKg' | 'loadNote',
    value: string,
  ) => void
  onToggleSet?: (setNumber: number) => void
  onSaveSet?: (setNumber: number) => void
}

function GymExerciseCard({
  exercise,
  sets,
  isSetSaving,
  isSetDirty,
  onChangeSet,
  onToggleSet,
  onSaveSet,
}: GymExerciseCardProps) {
  const completedSets = sets?.filter((set) => set.completed).length ?? 0

  return (
    <section className="rounded-card border border-lavender/25 bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-navy">{exercise.name}</h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {exercise.sets} × {exercise.targetReps}
          </p>
        </div>
        {sets ? (
          <span className="shrink-0 rounded-button bg-lavender/15 px-2.5 py-1 text-xs font-semibold text-navy">
            {completedSets} de {exercise.sets}
          </span>
        ) : null}
      </div>

      <div className="mt-3 rounded-control bg-lavender/10 px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">
          Objetivo
        </p>
        <p className="mt-1 text-sm leading-5 text-foreground">
          {exercise.prescription}
        </p>
      </div>

      {sets && isSetSaving && isSetDirty && onChangeSet && onToggleSet && onSaveSet ? (
        <ul className="mt-4 space-y-3">
          {sets.map((set) => (
            <GymSetRow
              key={set.setNumber}
              exerciseName={exercise.name}
              setNumber={set.setNumber}
              repsCompleted={set.repsCompleted}
              weightKg={set.weightKg}
              loadNote={set.loadNote}
              loadLabel={exercise.loadLabel ?? 'Carga (kg)'}
              completed={set.completed}
              saving={isSetSaving(set.setNumber)}
              dirty={isSetDirty(set.setNumber)}
              error={set.error}
              onChangeReps={(value) =>
                onChangeSet(set.setNumber, 'repsCompleted', value)
              }
              onChangeWeight={(value) =>
                onChangeSet(set.setNumber, 'weightKg', value)
              }
              onChangeLoadNote={(value) =>
                onChangeSet(set.setNumber, 'loadNote', value)
              }
              onToggleCompleted={() => onToggleSet(set.setNumber)}
              onSaveChanges={() => onSaveSet(set.setNumber)}
            />
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default GymExerciseCard
