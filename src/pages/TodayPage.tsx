import { useEffect, useRef, useState } from 'react'
import ConsistencyCard from '../components/dashboard/ConsistencyCard'
import DailyProgressCard from '../components/dashboard/DailyProgressCard'
import GymCard from '../components/dashboard/GymCard'
import QuickStats from '../components/dashboard/QuickStats'
import { DAILY_WATER_GOAL_ML } from '../constants/water'
import { mealPlan } from '../data/mealPlan'
import { useLocalDay } from '../day/LocalDayProvider'
import { supabase } from '../lib/supabase'

interface DashboardSummary {
  completedMeals: number
  totalMeals: number
  mealProgress: number
  totalWaterMl: number
  waterProgress: number
  dailyProgress: number
}

function getItemKey(mealId: string, itemId: string) {
  return `${mealId}:${itemId}`
}

async function fetchDashboardSummary(
  localDate: string,
): Promise<DashboardSummary | null> {
  try {
    const [mealResult, waterResult] = await Promise.all([
      supabase
        .from('meal_item_logs')
        .select('meal_id,item_id,completed')
        .eq('log_date', localDate),
      supabase
        .from('water_entries')
        .select('amount_ml')
        .eq('local_date', localDate),
    ])

    if (mealResult.error || waterResult.error) return null

    const completedItemKeys = new Set(
      (mealResult.data ?? [])
        .filter((log) => log.completed)
        .map((log) => getItemKey(log.meal_id, log.item_id)),
    )
    const totalMeals = mealPlan.length
    const completedMeals = mealPlan.filter((meal) =>
      meal.items.every((item) =>
        completedItemKeys.has(getItemKey(meal.id, item.id)),
      ),
    ).length
    const mealProgress =
      totalMeals > 0
        ? Math.round((completedMeals / totalMeals) * 100)
        : 0
    const totalWaterMl = (waterResult.data ?? []).reduce(
      (total, row) => total + row.amount_ml,
      0,
    )
    const waterProgress =
      DAILY_WATER_GOAL_ML > 0
        ? Math.min(
            Math.round((totalWaterMl / DAILY_WATER_GOAL_ML) * 100),
            100,
          )
        : 0
    const dailyProgress = Math.min(
      100,
      Math.max(0, Math.round((mealProgress + waterProgress) / 2)),
    )

    return {
      completedMeals,
      totalMeals,
      mealProgress,
      totalWaterMl,
      waterProgress,
      dailyProgress,
    }
  } catch {
    return null
  }
}

function TodayPage() {
  const { localDate } = useLocalDay()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
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

      const dashboardSummary = await fetchDashboardSummary(localDate)

      if (ignore) return

      if (dashboardSummary === null) {
        setLoadError('No pudimos cargar tu resumen de hoy.')
      } else {
        setSummary(dashboardSummary)
      }

      setLoadedDate(localDate)
      setLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [localDate])

  async function retryLoad() {
    const requestDate = localDate
    setLoadError(null)
    setLoading(true)

    const dashboardSummary = await fetchDashboardSummary(requestDate)

    if (
      !mountedRef.current ||
      currentLocalDateRef.current !== requestDate
    ) {
      return
    }

    if (dashboardSummary === null) {
      setLoadError('No pudimos cargar tu resumen de hoy.')
    } else {
      setSummary(dashboardSummary)
    }

    setLoadedDate(requestDate)
    setLoading(false)
  }

  if (loading || loadedDate !== localDate) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-card border border-border bg-surface p-5 text-sm text-muted-foreground shadow-soft"
      >
        Cargando tu día…
      </div>
    )
  }

  if (loadError || summary === null) {
    return (
      <div className="rounded-card border border-coral/25 bg-surface p-5 shadow-soft">
        <p role="alert" className="text-sm font-medium text-navy">
          {loadError ?? 'No pudimos cargar tu resumen de hoy.'}
        </p>
        <button
          type="button"
          onClick={() => void retryLoad()}
          className="mt-4 min-h-11 rounded-button bg-mint px-5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-mint/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DailyProgressCard progress={summary.dailyProgress} />
      <QuickStats
        completedMeals={summary.completedMeals}
        totalMeals={summary.totalMeals}
        mealProgress={summary.mealProgress}
        totalWaterMl={summary.totalWaterMl}
        waterGoalMl={DAILY_WATER_GOAL_ML}
        waterProgress={summary.waterProgress}
      />
      <GymCard />
      <ConsistencyCard />
    </div>
  )
}

export default TodayPage
