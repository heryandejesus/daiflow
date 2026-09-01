import { Dumbbell } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import GymDaySelector from '../components/gym/GymDaySelector'
import GymExerciseCard from '../components/gym/GymExerciseCard'
import GymSessionProgress from '../components/gym/GymSessionProgress'
import { gymPlan } from '../data/gymPlan'
import type { GymExercise, GymWorkoutDay, GymWorkoutDayId } from '../data/gymPlan'
import { useLocalDay } from '../day/LocalDayProvider'
import { supabase } from '../lib/supabase'

interface GymSession {
  id: string
  workoutDay: GymWorkoutDayId
  localDate: string
  startedAt: string
  completedAt: string | null
}

interface GymSessionRow {
  id: string
  workout_day: string
  local_date: string
  started_at: string
  completed_at: string | null
}

interface GymSetLogRow {
  id: string
  exercise_id: string
  set_number: number
  reps_completed: number | null
  weight_kg: number | null
  load_note: string | null
  completed: boolean
}

interface GymSetValues {
  repsCompleted: string
  weightKg: string
  loadNote: string
  completed: boolean
}

interface EditableGymSet extends GymSetValues {
  setNumber: number
  logId: string | null
  savedValues: GymSetValues | null
  error: string | null
}

type ExerciseSetsState = Record<string, EditableGymSet[]>

interface ActiveSessionBundle {
  session: GymSession | null
  exerciseSets: ExerciseSetsState
}

interface ValidatedSetValues {
  repsCompleted: number
  weightKg: number | null
  loadNote: string | null
}

const sessionSelect = 'id,workout_day,local_date,started_at,completed_at'
const setLogSelect =
  'id,exercise_id,set_number,reps_completed,weight_kg,load_note,completed'

function getWorkoutPlan(dayId: string): GymWorkoutDay | undefined {
  return gymPlan.find((day) => day.id === dayId)
}

function mapSession(row: GymSessionRow): GymSession | null {
  const plan = getWorkoutPlan(row.workout_day)
  if (!plan) return null

  return {
    id: row.id,
    workoutDay: plan.id,
    localDate: row.local_date,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }
}

function getSetKey(sessionId: string, exerciseId: string, setNumber: number) {
  return `${sessionId}:${exerciseId}:${setNumber}`
}

function getSetValues(set: EditableGymSet): GymSetValues {
  return {
    repsCompleted: set.repsCompleted,
    weightKg: set.weightKg,
    loadNote: set.loadNote,
    completed: set.completed,
  }
}

function haveSameSetValues(left: GymSetValues, right: GymSetValues) {
  return (
    left.repsCompleted === right.repsCompleted &&
    left.weightKg === right.weightKg &&
    left.loadNote === right.loadNote &&
    left.completed === right.completed
  )
}

function createInitialSet(exercise: GymExercise, setNumber: number): EditableGymSet {
  return {
    setNumber,
    repsCompleted: String(exercise.targetReps),
    weightKg: '',
    loadNote: '',
    completed: false,
    logId: null,
    savedValues: null,
    error: null,
  }
}

function createExerciseSets(
  plan: GymWorkoutDay,
  logs: GymSetLogRow[] = [],
): ExerciseSetsState {
  const logsBySet = new Map(
    logs.map((log) => [`${log.exercise_id}:${log.set_number}`, log]),
  )

  return Object.fromEntries(
    plan.exercises.map((exercise) => [
      exercise.id,
      Array.from({ length: exercise.sets }, (_, index) => {
        const initialSet = createInitialSet(exercise, index + 1)
        const log = logsBySet.get(`${exercise.id}:${index + 1}`)
        if (!log) return initialSet

        const values: GymSetValues = {
          repsCompleted:
            log.reps_completed === null ? '' : String(log.reps_completed),
          weightKg: log.weight_kg === null ? '' : String(log.weight_kg),
          loadNote: log.load_note ?? '',
          completed: log.completed,
        }

        return {
          ...initialSet,
          ...values,
          logId: log.id,
          savedValues: values,
        }
      }),
    ]),
  )
}

function validateSetValues(set: EditableGymSet): ValidatedSetValues | null {
  const repsCompleted = Number(set.repsCompleted.trim())
  if (!Number.isInteger(repsCompleted) || repsCompleted < 1 || repsCompleted > 999) {
    return null
  }

  const weightInput = set.weightKg.trim()
  const weightKg = weightInput === '' ? null : Number(weightInput.replace(',', '.'))
  if (
    weightKg !== null &&
    (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 5000)
  ) {
    return null
  }

  const loadNote = set.loadNote.trim()
  if (loadNote.length > 200) return null

  return {
    repsCompleted,
    weightKg,
    loadNote: loadNote === '' ? null : loadNote,
  }
}

async function fetchActiveSession(): Promise<ActiveSessionBundle | null> {
  try {
    const { data: sessionRow, error: sessionError } = await supabase
      .from('gym_sessions')
      .select(sessionSelect)
      .is('completed_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sessionError) return null
    if (!sessionRow) return { session: null, exerciseSets: {} }

    const session = mapSession(sessionRow)
    if (!session) return null

    const plan = getWorkoutPlan(session.workoutDay)
    if (!plan) return null

    const { data: logs, error: logsError } = await supabase
      .from('gym_set_logs')
      .select(setLogSelect)
      .eq('session_id', session.id)

    if (logsError) return null

    return {
      session,
      exerciseSets: createExerciseSets(plan, logs ?? []),
    }
  } catch {
    return null
  }
}

function GymPage() {
  const { localDate } = useLocalDay()
  const [selectedDay, setSelectedDay] = useState<GymWorkoutDayId>('day-1')
  const [activeSession, setActiveSession] = useState<GymSession | null>(null)
  const [exerciseSets, setExerciseSets] = useState<ExerciseSetsState>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [confirmPartialFinish, setConfirmPartialFinish] = useState(false)
  const [savingSetKeys, setSavingSetKeys] = useState<Set<string>>(() => new Set())
  const mountedRef = useRef(true)
  const activeSessionIdRef = useRef<string | null>(null)
  const savingSetKeysRef = useRef(new Set<string>())
  const isStartingRef = useRef(false)
  const isFinishingRef = useRef(false)

  function applySessionBundle(bundle: ActiveSessionBundle) {
    activeSessionIdRef.current = bundle.session?.id ?? null
    setActiveSession(bundle.session)
    setExerciseSets(bundle.exerciseSets)
    setSavingSetKeys(new Set())
    savingSetKeysRef.current = new Set()
    setConfirmPartialFinish(false)
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let ignore = false

    void Promise.resolve().then(async () => {
      if (ignore) return
      setLoading(true)
      setLoadError(null)

      const bundle = await fetchActiveSession()
      if (ignore) return

      if (bundle === null) {
        setLoadError('No pudimos cargar tu entrenamiento.')
      } else {
        applySessionBundle(bundle)
      }
      setLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [])

  async function retryLoad() {
    setLoading(true)
    setLoadError(null)
    setActionError(null)
    const bundle = await fetchActiveSession()
    if (!mountedRef.current) return

    if (bundle === null) {
      setLoadError('No pudimos cargar tu entrenamiento.')
    } else {
      applySessionBundle(bundle)
    }
    setLoading(false)
  }

  async function startTraining() {
    if (isStartingRef.current || activeSessionIdRef.current) return

    const operationDate = localDate
    const operationDay = selectedDay
    isStartingRef.current = true
    setIsStarting(true)
    setActionError(null)
    setSuccessMessage(null)

    try {
      const { data, error } = await supabase
        .from('gym_sessions')
        .insert({ workout_day: operationDay, local_date: operationDate })
        .select(sessionSelect)
        .single()

      if (!mountedRef.current) return

      if (error) {
        const existingBundle = await fetchActiveSession()
        if (!mountedRef.current) return
        if (existingBundle?.session) applySessionBundle(existingBundle)
        else setActionError('No pudimos iniciar tu entrenamiento.')
        return
      }

      const session = mapSession(data)
      const plan = session ? getWorkoutPlan(session.workoutDay) : undefined
      if (!session || !plan) {
        setActionError('No pudimos iniciar tu entrenamiento.')
        return
      }

      applySessionBundle({ session, exerciseSets: createExerciseSets(plan) })
    } catch {
      const existingBundle = await fetchActiveSession()
      if (!mountedRef.current) return
      if (existingBundle?.session) applySessionBundle(existingBundle)
      else setActionError('No pudimos iniciar tu entrenamiento.')
    } finally {
      if (mountedRef.current) {
        isStartingRef.current = false
        setIsStarting(false)
      }
    }
  }

  function updateSet(
    exerciseId: string,
    setNumber: number,
    updater: (set: EditableGymSet) => EditableGymSet,
  ) {
    setExerciseSets((current) => ({
      ...current,
      [exerciseId]: (current[exerciseId] ?? []).map((set) =>
        set.setNumber === setNumber ? updater(set) : set,
      ),
    }))
  }

  function changeSetField(
    exerciseId: string,
    setNumber: number,
    field: 'repsCompleted' | 'weightKg' | 'loadNote',
    value: string,
  ) {
    updateSet(exerciseId, setNumber, (set) => ({
      ...set,
      [field]: value,
      error: null,
    }))
    setActionError(null)
    setConfirmPartialFinish(false)
  }

  async function persistSet(
    exerciseId: string,
    setNumber: number,
    nextCompleted?: boolean,
  ) {
    const session = activeSession
    if (!session) return

    const operationSessionId = session.id
    const key = getSetKey(operationSessionId, exerciseId, setNumber)
    if (savingSetKeysRef.current.has(key)) return

    const currentSet = exerciseSets[exerciseId]?.find(
      (set) => set.setNumber === setNumber,
    )
    if (!currentSet) return

    const completed = nextCompleted ?? currentSet.completed
    const validated = validateSetValues({ ...currentSet, completed })
    if (!validated) {
      updateSet(exerciseId, setNumber, (set) => ({
        ...set,
        error: 'Revisá los datos de esta serie.',
      }))
      return
    }

    const previousSet = { ...currentSet }
    const valuesToSave: GymSetValues = {
      repsCompleted: currentSet.repsCompleted,
      weightKg: currentSet.weightKg,
      loadNote: currentSet.loadNote,
      completed,
    }

    savingSetKeysRef.current.add(key)
    setSavingSetKeys((current) => new Set(current).add(key))
    updateSet(exerciseId, setNumber, (set) => ({
      ...set,
      completed,
      error: null,
    }))
    setActionError(null)
    setConfirmPartialFinish(false)

    try {
      if (currentSet.logId === null) {
        if (!completed) return

        const { data, error } = await supabase
          .from('gym_set_logs')
          .insert({
            session_id: operationSessionId,
            exercise_id: exerciseId,
            set_number: setNumber,
            reps_completed: validated.repsCompleted,
            weight_kg: validated.weightKg,
            load_note: validated.loadNote,
            completed: true,
          })
          .select(setLogSelect)
          .single()

        if (!mountedRef.current || activeSessionIdRef.current !== operationSessionId) return

        if (error) {
          updateSet(exerciseId, setNumber, () => ({
            ...previousSet,
            error: 'No pudimos guardar esta serie. Intentá nuevamente.',
          }))
          return
        }

        updateSet(exerciseId, setNumber, (set) => ({
          ...set,
          logId: data.id,
          savedValues: valuesToSave,
          error: null,
        }))
      } else {
        const { error } = await supabase
          .from('gym_set_logs')
          .update({
            reps_completed: validated.repsCompleted,
            weight_kg: validated.weightKg,
            load_note: validated.loadNote,
            completed,
          })
          .eq('id', currentSet.logId)
          .eq('session_id', operationSessionId)

        if (!mountedRef.current || activeSessionIdRef.current !== operationSessionId) return

        if (error) {
          updateSet(exerciseId, setNumber, () => ({
            ...previousSet,
            error: 'No pudimos guardar esta serie. Intentá nuevamente.',
          }))
          return
        }

        updateSet(exerciseId, setNumber, (set) => ({
          ...set,
          savedValues: valuesToSave,
          error: null,
        }))
      }
    } catch {
      if (mountedRef.current && activeSessionIdRef.current === operationSessionId) {
        updateSet(exerciseId, setNumber, () => ({
          ...previousSet,
          error: 'No pudimos guardar esta serie. Intentá nuevamente.',
        }))
      }
    } finally {
      if (mountedRef.current && activeSessionIdRef.current === operationSessionId) {
        savingSetKeysRef.current.delete(key)
        setSavingSetKeys((current) => {
          const next = new Set(current)
          next.delete(key)
          return next
        })
      }
    }
  }

  function isExistingSetDirty(set: EditableGymSet) {
    return (
      set.logId !== null &&
      set.savedValues !== null &&
      !haveSameSetValues(getSetValues(set), set.savedValues)
    )
  }

  function isNewSetDraft(exercise: GymExercise, set: EditableGymSet) {
    return (
      set.logId === null &&
      (set.repsCompleted !== String(exercise.targetReps) ||
        set.weightKg !== '' ||
        set.loadNote !== '')
    )
  }

  const activePlan = activeSession ? getWorkoutPlan(activeSession.workoutDay) : undefined
  const selectedPlan = getWorkoutPlan(selectedDay) ?? gymPlan[0]
  const allSets = activePlan
    ? activePlan.exercises.flatMap((exercise) => exerciseSets[exercise.id] ?? [])
    : []
  const totalSets = activePlan
    ? activePlan.exercises.reduce((total, exercise) => total + exercise.sets, 0)
    : 0
  const completedSets = allSets.filter((set) => set.completed).length
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
  const hasDirtyExistingSets = allSets.some(isExistingSetDirty)
  const hasNewDrafts = activePlan
    ? activePlan.exercises.some((exercise) =>
        (exerciseSets[exercise.id] ?? []).some((set) => isNewSetDraft(exercise, set)),
      )
    : false
  const hasSavingSets = savingSetKeys.size > 0
  const hasPendingSets = completedSets < totalSets

  function requestFinish() {
    setActionError(null)
    if (hasSavingSets || isStartingRef.current || isFinishingRef.current) return

    if (hasDirtyExistingSets) {
      setActionError('Guardá los cambios pendientes antes de finalizar el entrenamiento.')
      return
    }

    if (hasPendingSets || hasNewDrafts) {
      setConfirmPartialFinish(true)
      return
    }

    void finishTraining()
  }

  async function finishTraining() {
    const session = activeSession
    if (
      !session ||
      isFinishingRef.current ||
      isStartingRef.current ||
      savingSetKeysRef.current.size > 0 ||
      hasDirtyExistingSets
    ) return

    const operationSessionId = session.id
    isFinishingRef.current = true
    setIsFinishing(true)
    setActionError(null)

    try {
      const { error } = await supabase
        .from('gym_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', operationSessionId)
        .is('completed_at', null)

      if (!mountedRef.current || activeSessionIdRef.current !== operationSessionId) return

      if (error) {
        setActionError('No pudimos finalizar tu entrenamiento.')
        return
      }

      activeSessionIdRef.current = null
      savingSetKeysRef.current = new Set()
      setActiveSession(null)
      setExerciseSets({})
      setSavingSetKeys(new Set())
      setConfirmPartialFinish(false)
      setSuccessMessage('Entrenamiento guardado')
    } catch {
      if (mountedRef.current && activeSessionIdRef.current === operationSessionId) {
        setActionError('No pudimos finalizar tu entrenamiento.')
      }
    } finally {
      if (mountedRef.current) {
        isFinishingRef.current = false
        setIsFinishing(false)
      }
    }
  }

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="rounded-card border border-border bg-surface p-5 text-sm text-muted-foreground shadow-soft">
        Cargando tu entrenamiento…
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-card border border-coral/25 bg-surface p-5 shadow-soft">
        <p role="alert" className="text-sm font-medium text-navy">{loadError}</p>
        <button type="button" onClick={() => void retryLoad()} className="mt-4 min-h-11 rounded-button bg-mint px-5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-mint/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">Gym</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu entrenamiento</p>
      </section>

      {successMessage ? (
        <p role="status" className="rounded-control border border-mint/40 bg-mint/15 px-4 py-3 text-sm font-semibold text-navy">{successMessage}</p>
      ) : null}
      {actionError ? (
        <p role="alert" className="rounded-control border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-medium text-navy">{actionError}</p>
      ) : null}

      {activeSession && activePlan ? (
        <>
          <GymSessionProgress
            completedSets={completedSets}
            totalSets={totalSets}
            progress={progress}
            isFinishing={isFinishing}
            finishDisabled={hasSavingSets || isStarting || isFinishing}
            onRequestFinish={requestFinish}
          />

          {confirmPartialFinish ? (
            <section aria-labelledby="finish-confirmation-title" className="rounded-card border border-lavender/35 bg-surface p-5 shadow-card">
              <h2 id="finish-confirmation-title" className="text-lg font-semibold text-navy">¿Finalizar entrenamiento?</h2>
              {hasPendingSets ? <p className="mt-2 text-sm leading-6 text-muted-foreground">Todavía quedan series pendientes. El entrenamiento se guardará como parcial.</p> : null}
              {hasNewDrafts ? <p className="mt-2 text-sm leading-6 text-muted-foreground">Hay datos escritos en series todavía no registradas. Si finalizás ahora, esos borradores no se guardarán.</p> : null}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => setConfirmPartialFinish(false)} className="min-h-11 rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-navy hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">Seguir entrenando</button>
                <button type="button" disabled={hasSavingSets || isStarting || isFinishing || hasDirtyExistingSets} onClick={() => void finishTraining()} className="min-h-11 rounded-button bg-navy px-4 py-2 text-sm font-semibold text-surface hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-55">
                  {hasNewDrafts ? 'Descartar borradores y finalizar' : 'Finalizar igualmente'}
                </button>
              </div>
            </section>
          ) : null}

          <div className="space-y-4">
            {activePlan.exercises.map((exercise) => (
              <GymExerciseCard
                key={exercise.id}
                exercise={exercise}
                sets={exerciseSets[exercise.id] ?? []}
                isSetSaving={(setNumber) => savingSetKeys.has(getSetKey(activeSession.id, exercise.id, setNumber))}
                isSetDirty={(setNumber) => {
                  const set = exerciseSets[exercise.id]?.find((item) => item.setNumber === setNumber)
                  return set ? isExistingSetDirty(set) : false
                }}
                onChangeSet={(setNumber, field, value) => changeSetField(exercise.id, setNumber, field, value)}
                onToggleSet={(setNumber) => {
                  const set = exerciseSets[exercise.id]?.find((item) => item.setNumber === setNumber)
                  if (set) void persistSet(exercise.id, setNumber, !set.completed)
                }}
                onSaveSet={(setNumber) => void persistSet(exercise.id, setNumber)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <section className="rounded-card border border-lavender/30 bg-surface p-5 shadow-card">
            <div className="flex size-12 items-center justify-center rounded-control bg-lavender/20 text-navy">
              <Dumbbell aria-hidden="true" className="size-6" strokeWidth={2} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-navy">Elegí tu rutina</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Revisá el plan y comenzá cuando estés lista.</p>
            <div className="mt-4">
              <GymDaySelector days={gymPlan} selectedDay={selectedDay} disabled={isStarting} onSelect={(day) => {
                setSelectedDay(day)
                setSuccessMessage(null)
                setActionError(null)
              }} />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              {selectedPlan.exercises.length} ejercicios · {selectedPlan.exercises.reduce((total, exercise) => total + exercise.sets, 0)} series
            </p>
            <button type="button" disabled={isStarting} onClick={() => void startTraining()} className="mt-5 min-h-11 w-full rounded-button bg-navy px-5 py-3 text-sm font-semibold text-surface transition-colors hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-55">
              {isStarting ? 'Iniciando…' : 'Comenzar entrenamiento'}
            </button>
          </section>
          <div className="space-y-4">
            {selectedPlan.exercises.map((exercise) => <GymExerciseCard key={exercise.id} exercise={exercise} />)}
          </div>
        </>
      )}
    </div>
  )
}

export default GymPage
