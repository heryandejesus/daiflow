import { useEffect, useMemo, useRef, useState } from 'react'
import GymProgressCard from '../components/progress/GymProgressCard'
import WeeklyProgressChart from '../components/progress/WeeklyProgressChart'
import WeeklySummaryCards from '../components/progress/WeeklySummaryCards'
import { gymPlan } from '../data/gymPlan'
import { useLocalDay } from '../day/LocalDayProvider'
import { supabase } from '../lib/supabase'
import { getCurrentWeek } from '../utils/weekDates'
import type { CurrentWeek } from '../utils/weekDates'
import {
  calculateWeeklySummary,
  calculateGymWeeklySummary,
} from '../utils/progressCalculations'
import type { GymSetLogRow, WeeklySummary } from '../utils/progressCalculations'

const rangeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
})

async function fetchWeeklySummary(week: CurrentWeek) {
  try {
    const [mealResult, waterResult, gymSessionsResult] = await Promise.all([
      supabase
        .from('meal_item_logs')
        .select('meal_id,item_id,completed,log_date')
        .gte('log_date', week.startDateString)
        .lte('log_date', week.endDateString),
      supabase
        .from('water_entries')
        .select('amount_ml,local_date')
        .gte('local_date', week.startDateString)
        .lte('local_date', week.endDateString),
      supabase
        .from('gym_sessions')
        .select('id,workout_day,local_date,started_at,completed_at')
        .gte('local_date', week.startDateString)
        .lte('local_date', week.endDateString),
    ])

    if (mealResult.error || waterResult.error || gymSessionsResult.error) {
      return null
    }

    const gymSessions = gymSessionsResult.data ?? []
    const completedSessionIds = gymSessions
      .filter(
        (session) =>
          session.completed_at !== null &&
          gymPlan.some((day) => day.id === session.workout_day),
      )
      .map((session) => session.id)
    let gymSetLogs: GymSetLogRow[] = []

    if (completedSessionIds.length > 0) {
      const { data, error } = await supabase
        .from('gym_set_logs')
        .select('session_id,exercise_id,set_number,completed')
        .in('session_id', completedSessionIds)

      if (error) return null

      gymSetLogs = data ?? []
    }

    return {
      ...calculateWeeklySummary(
        week,
        mealResult.data ?? [],
        waterResult.data ?? [],
      ),
      gym: calculateGymWeeklySummary(gymSessions, gymSetLogs),
    }
  } catch {
    return null
  }
}

function ProgressPage() {
  const { currentDate, localDate } = useLocalDay()
  const week = useMemo(() => getCurrentWeek(currentDate), [currentDate])
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadedDate, setLoadedDate] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const currentLocalDateRef = useRef(localDate)

  useEffect(() => {
    currentLocalDateRef.current = localDate
  }, [localDate])

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
      setSummary(null)

      const weeklySummary = await fetchWeeklySummary(week)
      if (ignore) return

      if (weeklySummary === null) {
        setLoadError('No pudimos cargar tu progreso.')
      } else {
        setSummary(weeklySummary)
      }

      setLoadedDate(localDate)
      setLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [localDate, week])

  async function retryLoad() {
    const requestDate = localDate
    const requestWeek = week
    setLoadError(null)
    setLoading(true)

    const weeklySummary = await fetchWeeklySummary(requestWeek)

    if (!mountedRef.current || currentLocalDateRef.current !== requestDate) {
      return
    }

    if (weeklySummary === null) {
      setLoadError('No pudimos cargar tu progreso.')
    } else {
      setSummary(weeklySummary)
    }

    setLoadedDate(requestDate)
    setLoading(false)
  }

  const weekRange = `${rangeFormatter.format(week.startDate)} – ${rangeFormatter.format(week.endDate)}`

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">
          Progreso
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu semana</p>
      </section>

      {loading || loadedDate !== localDate ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-card border border-border bg-surface p-5 text-sm text-muted-foreground shadow-soft"
        >
          Cargando tu progreso…
        </div>
      ) : loadError || summary === null ? (
        <div className="rounded-card border border-coral/25 bg-surface p-5 shadow-soft">
          <p role="alert" className="text-sm font-medium text-navy">
            {loadError ?? 'No pudimos cargar tu progreso.'}
          </p>
          <button
            type="button"
            onClick={() => void retryLoad()}
            className="mt-4 min-h-11 rounded-button bg-mint px-5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-mint/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <section className="rounded-card border border-border bg-mint/10 p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-navy">
                  Promedio semanal
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comidas e hidratación
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {weekRange}
                </p>
              </div>
              <p className="text-3xl font-bold tracking-tight text-navy">
                {summary.weeklyProgress}%
              </p>
            </div>

            <div
              role="progressbar"
              aria-label="Promedio semanal de comidas e hidratación"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.weeklyProgress}
              className="mt-5 h-3 overflow-hidden rounded-button bg-mint/20"
            >
              <div
                className="h-full rounded-button bg-mint"
                style={{ width: `${summary.weeklyProgress}%` }}
              />
            </div>
          </section>

          <WeeklyProgressChart days={summary.chartDays} />

          <WeeklySummaryCards
            completedMeals={summary.completedMeals}
            possibleMeals={summary.possibleMeals}
            averageMealProgress={summary.averageMealProgress}
            waterGoalDays={summary.waterGoalDays}
            elapsedDays={summary.elapsedDays}
            averageWaterProgress={summary.averageWaterProgress}
          />

          <GymProgressCard
            completedSessions={summary.gym.completedSessions}
            completedSets={summary.gym.completedSets}
            possibleSets={summary.gym.possibleSets}
            progress={summary.gym.progress}
            activeSessionCount={summary.gym.activeSessionCount}
            latestSession={summary.gym.latestSession}
          />
        </>
      )}
    </div>
  )
}

export default ProgressPage
