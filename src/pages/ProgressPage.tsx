import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import WeeklyPeriodNavigator from '../components/progress/WeeklyPeriodNavigator'
import GymProgressCard from '../components/progress/GymProgressCard'
import WeeklyProgressChart from '../components/progress/WeeklyProgressChart'
import WeeklySummaryCards from '../components/progress/WeeklySummaryCards'
import { gymPlan } from '../data/gymPlan'
import { useLocalDay } from '../day/LocalDayProvider'
import { supabase } from '../lib/supabase'
import { getWeek } from '../utils/weekDates'
import {
  formatWeekRange,
  getAdjacentWeekDate,
  resolveWeeklyPeriod,
} from '../utils/weeklyPeriod'
import type { CurrentWeek } from '../utils/weekDates'
import {
  calculateWeeklySummary,
  calculateGymWeeklySummary,
} from '../utils/progressCalculations'
import type { GymSetLogRow, WeeklySummary } from '../utils/progressCalculations'

interface LoadedWeeklySummary extends WeeklySummary {
  hasRecords: boolean
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
      hasRecords:
        (mealResult.data?.length ?? 0) > 0 ||
        (waterResult.data?.length ?? 0) > 0 ||
        gymSessions.length > 0,
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
  const { localDate: currentLocalDate } = useLocalDay()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.toString()
  const { baseDate, currentWeekStart, canonicalSearch } =
    resolveWeeklyPeriod(search, currentLocalDate)
  const week = useMemo(
    () => getWeek(baseDate, currentLocalDate),
    [baseDate, currentLocalDate],
  )
  const isCurrentWeek = week.startDateString === currentWeekStart
  const previousWeekDate = getAdjacentWeekDate(week.startDateString, -1, currentLocalDate)
  const nextWeekDate = getAdjacentWeekDate(week.startDateString, 1, currentLocalDate)
  const [summary, setSummary] = useState<LoadedWeeklySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadedWeek, setLoadedWeek] = useState<CurrentWeek | null>(null)
  const mountedRef = useRef(true)
  const activeWeekRef = useRef<CurrentWeek | null>(null)
  const loadGenerationRef = useRef(0)

  useEffect(() => {
    if (search !== canonicalSearch) {
      setSearchParams(canonicalSearch, { replace: true })
    }
  }, [search, canonicalSearch, setSearchParams])

  // A fresh week object distinguishes visits A -> B -> A and local-day changes.
  // Invalidate at commit, before passive loads or late promise callbacks run.
  useLayoutEffect(() => {
    mountedRef.current = true
    activeWeekRef.current = week
    loadGenerationRef.current += 1
    return () => {
      mountedRef.current = false
      activeWeekRef.current = null
      loadGenerationRef.current += 1
    }
  }, [week])

  useEffect(() => {
    let ignore = false
    const generation = loadGenerationRef.current
    const isCurrent = () =>
      !ignore &&
      mountedRef.current &&
      activeWeekRef.current === week &&
      loadGenerationRef.current === generation

    void Promise.resolve().then(async () => {
      if (!isCurrent()) return

      setLoading(true)
      setLoadError(null)
      setSummary(null)

      const weeklySummary = await fetchWeeklySummary(week)
      if (!isCurrent()) return

      if (weeklySummary === null) {
        setLoadError('No pudimos cargar tu progreso.')
      } else {
        setSummary(weeklySummary)
      }

      setLoadedWeek(week)
      setLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [week])

  async function retryLoad() {
    if (!mountedRef.current || activeWeekRef.current !== week) return
    const requestWeek = week
    const generation = ++loadGenerationRef.current
    setLoadError(null)
    setLoading(true)

    const weeklySummary = await fetchWeeklySummary(requestWeek)

    if (
      !mountedRef.current ||
      activeWeekRef.current !== requestWeek ||
      loadGenerationRef.current !== generation
    ) {
      return
    }

    if (weeklySummary === null) {
      setLoadError('No pudimos cargar tu progreso.')
    } else {
      setSummary(weeklySummary)
    }

    setLoadedWeek(requestWeek)
    setLoading(false)
  }

  function navigateWeek(direction: -1 | 1) {
    const date = getAdjacentWeekDate(week.startDateString, direction, currentLocalDate)
    if (date === null) return
    const nextParams = new URLSearchParams(search)
    nextParams.set('view', 'week')
    nextParams.set('date', date)
    setSearchParams(nextParams)
  }

  function returnToCurrentWeek() {
    const nextParams = new URLSearchParams(search)
    nextParams.delete('date')
    nextParams.delete('view')
    setSearchParams(nextParams)
  }

  function openDay(dateString: string) {
    const params = new URLSearchParams({ from: 'week', week: week.startDateString })
    navigate(`/progreso/dia/${dateString}?${params.toString()}`)
  }

  const weekRange = formatWeekRange(week, currentLocalDate)

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">
          Progreso
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu semana</p>
      </section>

      <WeeklyPeriodNavigator
        rangeLabel={weekRange}
        isCurrentWeek={isCurrentWeek}
        canGoPrevious={previousWeekDate !== null}
        canGoNext={nextWeekDate !== null}
        onPrevious={() => navigateWeek(-1)}
        onNext={() => navigateWeek(1)}
        onReturnToCurrent={returnToCurrentWeek}
      />

      {loading || loadedWeek !== week ? (
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
          {!summary.hasRecords ? (
            <p className="text-center text-sm text-muted-foreground">
              No hay registros en esta semana.
            </p>
          ) : null}

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

          <WeeklyProgressChart days={summary.chartDays} onDaySelect={openDay} />

          <WeeklySummaryCards
            completedMeals={summary.completedMeals}
            possibleMeals={summary.possibleMeals}
            averageMealProgress={summary.averageMealProgress}
            waterGoalDays={summary.waterGoalDays}
            elapsedDays={summary.elapsedDays}
            averageWaterProgress={summary.averageWaterProgress}
          />

          <GymProgressCard
            isCurrentWeek={isCurrentWeek}
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
