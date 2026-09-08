import { DAILY_WATER_GOAL_ML } from '../constants/water'
import { gymPlan } from '../data/gymPlan'
import { mealPlan } from '../data/mealPlan'
import type { CurrentWeek } from './weekDates'

export interface LatestGymSessionSummary {
  workoutTitle: string
  completedSets: number
  totalSets: number
  progress: number
}

export interface WeeklyProgressDay {
  dateString: string
  shortLabel: string
  fullLabel: string
  progress: number | null
  isToday: boolean
  isFuture: boolean
}

export interface MealLogRow {
  meal_id: string
  item_id: string
  completed: boolean
  log_date: string
}

export interface WaterEntryRow {
  amount_ml: number
  local_date: string
}

export interface GymSessionRow {
  id: string
  workout_day: string
  local_date: string
  started_at: string
  completed_at: string | null
}

export interface GymSetLogRow {
  session_id: string
  exercise_id: string
  set_number: number
  completed: boolean
}

export interface GymWeeklySummary {
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

export interface ElapsedDayResult {
  completedMeals: number
  mealProgress: number
  waterProgress: number
  waterGoalReached: boolean
  dailyProgress: number
}

export interface WeeklySummary {
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

/** Item keys are mealId:itemId. Water is capped before combining daily values. */
export function calculateDailyProgress(
  completedItems: ReadonlySet<string>,
  totalWaterMl: number,
): ElapsedDayResult {
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

  return {
    completedMeals,
    mealProgress,
    waterProgress,
    waterGoalReached,
    dailyProgress,
  }
}

function getItemKey(mealId: string, itemId: string) {
  return `${mealId}:${itemId}`
}

function getAverage(values: number[]) {
  if (values.length === 0) return 0

  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length,
  )
}

/** Accepts period days; the weekly result names preserve the existing API. */
export function calculateWeeklySummary(
  week: Pick<CurrentWeek, 'days'>,
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
    const {
      completedMeals,
      mealProgress,
      waterProgress,
      waterGoalReached,
      dailyProgress,
    } = calculateDailyProgress(
      completedItems,
      waterByDate.get(day.dateString) ?? 0,
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

/** Sessions must already be scoped by local_date, as in the existing query. */
export function calculateGymWeeklySummary(
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

