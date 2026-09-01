import { Check } from 'lucide-react'
import { useId, useState } from 'react'

interface GymSetRowProps {
  exerciseName: string
  setNumber: number
  repsCompleted: string
  weightKg: string
  loadNote: string
  loadLabel: string
  completed: boolean
  saving: boolean
  dirty: boolean
  error: string | null
  onChangeReps: (value: string) => void
  onChangeWeight: (value: string) => void
  onChangeLoadNote: (value: string) => void
  onToggleCompleted: () => void
  onSaveChanges: () => void
}

function GymSetRow({
  exerciseName,
  setNumber,
  repsCompleted,
  weightKg,
  loadNote,
  loadLabel,
  completed,
  saving,
  dirty,
  error,
  onChangeReps,
  onChangeWeight,
  onChangeLoadNote,
  onToggleCompleted,
  onSaveChanges,
}: GymSetRowProps) {
  const fieldId = useId()
  const [showDetail, setShowDetail] = useState(() => loadNote.length > 0)
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <li
      className={`rounded-control border border-border bg-background/70 p-3 transition-opacity ${
        saving ? 'opacity-65' : ''
      }`}
    >
      <div className="flex min-h-11 items-center justify-between gap-3">
        <p className="text-sm font-semibold text-navy">Serie {setNumber}</p>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-navy has-disabled:cursor-wait">
          <span>{completed ? 'Completada' : 'Completar'}</span>
          <input
            type="checkbox"
            checked={completed}
            disabled={saving}
            aria-describedby={errorId}
            onChange={onToggleCompleted}
            className="peer sr-only"
          />
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-lavender/50 bg-surface transition-colors peer-checked:border-lavender peer-checked:bg-lavender peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy peer-disabled:opacity-60">
            {completed ? (
              <Check aria-hidden="true" className="size-4 text-navy" />
            ) : null}
          </span>
        </label>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-muted-foreground">
          Reps
          <input
            type="text"
            inputMode="numeric"
            value={repsCompleted}
            disabled={saving}
            aria-label={`${exerciseName}, serie ${setNumber}, repeticiones`}
            aria-describedby={errorId}
            onChange={(event) => onChangeReps(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-control border border-border bg-surface px-3 text-base text-navy outline-none transition-colors focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender/30 disabled:cursor-wait"
          />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          {loadLabel}
          <input
            type="text"
            inputMode="decimal"
            value={weightKg}
            disabled={saving}
            aria-label={`${exerciseName}, serie ${setNumber}, ${loadLabel}`}
            aria-describedby={errorId}
            onChange={(event) => onChangeWeight(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-control border border-border bg-surface px-3 text-base text-navy outline-none transition-colors focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender/30 disabled:cursor-wait"
          />
        </label>
      </div>

      {showDetail ? (
        <label className="mt-3 block text-xs font-medium text-muted-foreground">
          Detalle de carga o modalidad
          <input
            type="text"
            value={loadNote}
            maxLength={200}
            disabled={saving}
            aria-label={`${exerciseName}, serie ${setNumber}, detalle de carga o modalidad`}
            aria-describedby={errorId}
            placeholder="Máquina, Smith…"
            onChange={(event) => onChangeLoadNote(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-control border border-border bg-surface px-3 text-base text-navy outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-lavender focus-visible:ring-2 focus-visible:ring-lavender/30 disabled:cursor-wait"
          />
        </label>
      ) : null}

      <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => setShowDetail((current) => !current)}
          className="min-h-11 rounded-button px-2 text-sm font-semibold text-navy hover:bg-lavender/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-wait"
        >
          {showDetail ? 'Ocultar detalle' : '+ detalle'}
        </button>

        {saving ? (
          <span role="status" className="text-xs font-medium text-muted-foreground">
            Guardando…
          </span>
        ) : dirty ? (
          <button
            type="button"
            onClick={onSaveChanges}
            className="min-h-11 rounded-button bg-lavender/20 px-4 text-sm font-semibold text-navy transition-colors hover:bg-lavender/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            Guardar cambios
          </button>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-coral">
          {error}
        </p>
      ) : null}
    </li>
  )
}

export default GymSetRow
