import { useEffect, useMemo, useRef, useState } from 'react'
import GymProgressCard from '../components/progress/GymProgressCard'
import type { LatestGymSessionSummary } from '../components/progress/GymProgressCard'
import WeeklyProgressChart from '../components/progress/WeeklyProgressChart'
import type { WeeklyProgressDay } from '../components/progress/WeeklyProgressChart'
import WeeklySummaryCards from '../components/progress/WeeklySummaryCards'
import { DAILY_WATER_GOAL_ML } from '../constants/water'
import { gymPlan } from '../data/gymPlan'
import { mealPlan } from '../data/mealPlan'
import { useLocalDay } from '../day/LocalDayProvider'
import { supabase } from '../lib/supabase'
import { getCurrentWeek } from '../utils/weekDates'
import type { CurrentWeek } from '../utils/weekDates'

interface MealLogRow {
  meal_id: string
  item_id: string
  completed: boolean
  log_date: string
}

interface WaterEntryRow {
  amount_ml: number
  local_date: string
}

interface GymSessionRow {
  id: string
  workout_day: string
  local_date: string
  started_at: string
  completed_at: string | null
}

interface GymSetLogRow {
  session_id: string
  exercise_id: string
  set_number: number
  completed: boolean
}

interface GymWeeklySummary {
  completedSessions: number
  completedSets: number
  possibleSets: number
  progress: number | null
  activeSessionCount: number
  latestSession: LatestGymSessionSummary | null
}

interface CompletedGymSessionResult {
  completedAt: string
  workoutTitle: string
  completedSets: number
  totalSets: number
  progress: number
}

interface ElapsedDayResult {
  completedMeals: number
  mealProgress: number
  waterProgress: number
  waterGoalReached: boolean
  dailyProgress: number
}

interface WeeklySummary {
  weeklyProgress: number
  completedMeals: number
  possibleMeals: number
  averageMealProgress: number
  waterGoalDays: number
  elapsedDays: number
  averageWaterProgress: number
  chartDays: WeeklyProgressDay[]
  gym: GymWeeklySummary
}

const rangeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
})

function getItemKey(mealId: string, itemId: string) {
  return `${mealId}:${itemId}`
}

function getAverage(values: number[]) {
  if (values.length === 0) return 0

  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length,
  )
}

function calculateWeeklySummary(
  week: CurrentWeek,
  mealLogs: MealLogRow[],
  waterEntries: WaterEntryRow[],
): Omit<WeeklySummary, 'gym'> {
  const completedItemsByDate = new Map<string, Set<string>>()

  for (const log of mealLogs) {
    if (!log.completed) continue

    const completedItems =
      completedItemsByDate.get(log.log_date) ?? new Set<string>()
    completedItems.add(getItemKey(log.meal_id, log.item_id))
    completedItemsByDate.set(log.log_date, completedItems)
  }

  const waterByDate = new Map<string, number>()

  for (const entry of waterEntries) {
    waterByDate.set(
      entry.local_date,
      (waterByDate.get(entry.local_date) ?? 0) + entry.amount_ml,
    )
  }

  const elapsedDayResults: ElapsedDayResult[] = []
  const chartDays: WeeklyProgressDay[] = week.days.map((day) => {
    if (day.isFuture) {
      return {
        dateString: day.dateString,
        shortLabel: day.shortLabel,
        fullLabel: day.fullLabel,
        progress: null,
        isToday: day.isToday,
        isFuture: true,
      }
    }

    const completedItems =
      completedItemsByDate.get(day.dateString) ?? new Set<string>()
    const completedMeals = mealPlan.filter((meal) =>
      meal.items.every((item) =>
        completedItems.has(getItemKey(meal.id, item.id)),
      ),
    ).length
    const totalMeals = mealPlan.length
    const mealProgress =
      totalMeals > 0
        ? Math.round((completedMeals / totalMeals) * 100)
        : 0
    const totalWaterMl = waterByDate.get(day.dateString) ?? 0
    const waterProgress =
      DAILY_WATER_GOAL_ML > 0
        ? Math.min(
            Math.round((totalWaterMl / DAILY_WATER_GOAL_ML) * 100),
            100,
          )
        : 0
    const waterGoalReached = totalWaterMl >= DAILY_WATER_GOAL_ML
    const dailyProgress = Math.min(
      100,
      Math.max(0, Math.round((mealProgress + waterProgress) / 2)),
    )

    elapsedDayResults.push({
      completedMeals,
      mealProgress,
      waterProgress,
      waterGoalReached,
      dailyProgress,
    })

    return {
      dateString: day.dateString,
      shortLabel: day.shortLabel,
      fullLabel: day.fullLabel,
      progress: dailyProgress,
      isToday: day.isToday,
      isFuture: false,
    }
  })

  const elapsedDays = elapsedDayResults.length

  return {
    weeklyProgress: getAverage(
      elapsedDayResults.map((day) => day.dailyProgress),
    ),
    completedMeals: elapsedDayResults.reduce(
      (total, day) => total + day.completedMeals,
      0,
    ),
    possibleMeals: elapsedDays * mealPlan.length,
    averageMealProgress: getAverage(
      elapsedDayResults.map((day) => day.mealProgress),
    ),
    waterGoalDays: elapsedDayResults.filter((day) => day.waterGoalReached)
      .length,
    elapsedDays,
    averageWaterProgress: getAverage(
      elapsedDayResults.map((day) => day.waterProgress),
    ),
    chartDays,
  }
}

function calculateGymWeeklySummary(
  sessions: GymSessionRow[],
  setLogs: GymSetLogRow[],
): GymWeeklySummary {
  const validSessions = sessions.flatMap((session) => {
    const workout = gymPlan.find((day) => day.id === session.workout_day)
    return workout ? [{ session, workout }] : []
  })
  const activeSessionCount = validSessions.filter(
    ({ session }) => session.completed_at === null,
  ).length
  const logsBySession = new Map<string, GymSetLogRow[]>()

  for (const log of setLogs) {
    const sessionLogs = logsBySession.get(log.session_id) ?? []
    sessionLogs.push(log)
    logsBySession.set(log.session_id, sessionLogs)
  }

  const completedSessionResults: CompletedGymSessionResult[] = []

  for (const { session, workout } of validSessions) {
    if (session.completed_at === null) continue

    const validSetKeys = new Set(
      workout.exercises.flatMap((exercise) =>
        Array.from(
          { length: exercise.sets },
          (_, index) => `${exercise.id}:${index + 1}`,
        ),
      ),
    )
    const completedSetKeys = new Set(
      (logsBySession.get(session.id) ?? [])
        .filter((log) => log.completed)
        .map((log) => `${log.exercise_id}:${log.set_number}`)
        .filter((key) => validSetKeys.has(key)),
    )
    const totalSets = workout.exercises.reduce(
      (total, exercise) => total + exercise.sets,
      0,
    )
    const completedSets = completedSetKeys.size
    const progress =
      totalSets > 0
        ? Math.min(
            100,
            Math.max(0, Math.round((completedSets / totalSets) * 100)),
          )
        : 0

    completedSessionResults.push({
      completedAt: session.completed_at,
      workoutTitle: workout.title,
      completedSets,
      totalSets,
      progress,
    })
  }

  const completedSets = completedSessionResults.reduce(
    (total, session) => total + session.completedSets,
    0,
  )
  const possibleSets = completedSessionResults.reduce(
    (total, session) => total + session.totalSets,
    0,
  )
  const latestResult = completedSessionResults.reduce<
    CompletedGymSessionResult | undefined
  >((latest, session) => {
    if (!latest) return session

    return new Date(session.completedAt).getTime() >
      new Date(latest.completedAt).getTime()
      ? session
      : latest
  }, undefined)

  return {
    completedSessions: completedSessionResults.length,
    completedSets,
    possibleSets,
    progress:
      possibleSets > 0
        ? Math.min(
            100,
            Math.max(0, Math.round((completedSets / possibleSets) * 100)),
          )
        : null,
    activeSessionCount,
    latestSession: latestResult
      ? {
          workoutTitle: latestResult.workoutTitle,
          completedSets: latestResult.completedSets,
          totalSets: latestResult.totalSets,
          progress: latestResult.progress,
        }
      : null,
  }
}

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
