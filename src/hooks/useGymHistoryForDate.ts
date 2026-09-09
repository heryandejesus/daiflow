import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gymPlan } from '../data/gymPlan'
import type { GymExercise, GymWorkoutDay } from '../data/gymPlan'
import { supabase } from '../lib/supabase'

export interface GymHistorySet {
  id: string
  exerciseId: string
  setNumber: number
  repsCompleted: number | null
  weightKg: number | null
  loadNote: string | null
  completed: boolean
}

export interface GymHistorySession {
  id: string
  workout: GymWorkoutDay
  startedAt: string
  completedAt: string
  sets: GymHistorySet[]
}

interface SessionRow { id: string; workout_day: string; started_at: string; completed_at: string | null }
interface SetRow { id: string; session_id: string; exercise_id: string; set_number: number; reps_completed: number | null; weight_kg: number | null; load_note: string | null; completed: boolean }

export function getHistoryExercise(workout: GymWorkoutDay, id: string): GymExercise | undefined {
  return workout.exercises.find((exercise) => exercise.id === id)
}

async function fetchGymHistory(selectedDate: string) {
  const { data: sessionRows, error: sessionsError } = await supabase
    .from('gym_sessions')
    .select('id,workout_day,started_at,completed_at')
    .eq('local_date', selectedDate)
  if (sessionsError) return null

  const validSessions = (sessionRows ?? []).flatMap((row: SessionRow) => {
    const workout = gymPlan.find((plan) => plan.id === row.workout_day)
    return workout && row.completed_at
      ? [{ row, workout }]
      : []
  })
  const activeSession = (sessionRows ?? []).some(
    (row: SessionRow) => row.completed_at === null && gymPlan.some((plan) => plan.id === row.workout_day),
  )
  const ids = validSessions.map(({ row }) => row.id)
  let setRows: SetRow[] = []
  if (ids.length > 0) {
    const { data, error } = await supabase
      .from('gym_set_logs')
      .select('id,session_id,exercise_id,set_number,reps_completed,weight_kg,load_note,completed')
      .in('session_id', ids)
    if (error) return null
    setRows = data ?? []
  }
  const setsBySession = new Map<string, GymHistorySet[]>()
  for (const row of setRows) {
    const sets = setsBySession.get(row.session_id) ?? []
    sets.push({ id: row.id, exerciseId: row.exercise_id, setNumber: row.set_number, repsCompleted: row.reps_completed, weightKg: row.weight_kg, loadNote: row.load_note, completed: row.completed })
    setsBySession.set(row.session_id, sets)
  }
  return {
    activeSession,
    sessions: validSessions.map(({ row, workout }) => ({ id: row.id, workout, startedAt: row.started_at, completedAt: row.completed_at as string, sets: setsBySession.get(row.id) ?? [] })),
  }
}

async function safeFetchGymHistory(selectedDate: string) {
  try { return await fetchGymHistory(selectedDate) } catch { return null }
}

export function useGymHistoryForDate(selectedDate: string) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchGymHistory>>>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const context = useMemo(() => ({ selectedDate }), [selectedDate])
  const activeContextRef = useRef(context)
  const generationRef = useRef(0)
  const mountedRef = useRef(true)

  useLayoutEffect(() => {
    activeContextRef.current = context
    generationRef.current += 1
    mountedRef.current = true
    return () => { generationRef.current += 1; mountedRef.current = false }
  }, [context])

  useEffect(() => {
    const generation = generationRef.current
    let ignore = false
    const current = () => !ignore && mountedRef.current && activeContextRef.current === context && generationRef.current === generation
    void safeFetchGymHistory(selectedDate).then((result) => {
      if (!current()) return
      if (result === null) setError('No pudimos cargar el historial de Gym.')
      else setData(result)
      setLoading(false)
    })
    return () => { ignore = true }
  }, [context, selectedDate])

  async function retry() {
    const generation = ++generationRef.current
    setLoading(true); setError(null)
    const result = await safeFetchGymHistory(selectedDate)
    if (!mountedRef.current || activeContextRef.current !== context || generationRef.current !== generation) return
    if (result === null) setError('No pudimos cargar el historial de Gym.')
    else setData(result)
    setLoading(false)
  }
  return { data, loading, error, retry }
}
