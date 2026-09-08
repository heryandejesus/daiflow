import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { mealPlan } from '../data/mealPlan'
import type { MealPlanEntry } from '../data/mealPlan'
import { supabase } from '../lib/supabase'

export interface Meal extends Omit<MealPlanEntry, 'items'> {
  items: (MealPlanEntry['items'][number] & { completed: boolean })[]
}

interface MealItemLog {
  meal_id: string
  item_id: string
  completed: boolean
}

function getItemKey(mealId: string, itemId: string) {
  return `${mealId}:${itemId}`
}

function mergeMealLogs(logs: MealItemLog[]): Meal[] {
  const logsByItem = new Map(
    logs.map((log) => [
      getItemKey(log.meal_id, log.item_id),
      log.completed,
    ]),
  )

  return mealPlan.map((meal) => ({
    ...meal,
    items: meal.items.map((item) => ({
      ...item,
      completed: logsByItem.get(getItemKey(meal.id, item.id)) ?? false,
    })),
  }))
}

async function fetchMealLogs(selectedDate: string) {
  try {
    const { data, error } = await supabase
      .from('meal_item_logs')
      .select('meal_id,item_id,completed')
      .eq('log_date', selectedDate)

    return error ? null : (data ?? [])
  } catch {
    return null
  }
}

export function useMealsForDate(selectedDate: string) {
  const [meals, setMeals] = useState<Meal[]>(() => mergeMealLogs([]))
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savingItems, setSavingItems] = useState<Set<string>>(() => new Set())
  const savingItemsRef = useRef(new Set<string>())
  const mountedRef = useRef(true)
  // Each visit gets its own identity, including A -> B -> A.
  const context = useMemo(() => ({ selectedDate }), [selectedDate])
  const activeContextRef = useRef<typeof context | null>(null)
  const loadGenerationRef = useRef(0)
  const readyRef = useRef(false)
  const [loadedContext, setLoadedContext] = useState<typeof context | null>(null)

  // Invalidate before passive effects or late promise callbacks can run.
  useLayoutEffect(() => {
    mountedRef.current = true
    activeContextRef.current = context
    loadGenerationRef.current += 1
    readyRef.current = false
    return () => {
      mountedRef.current = false
      activeContextRef.current = null
      loadGenerationRef.current += 1
      readyRef.current = false
    }
  }, [context])

  useEffect(() => {
    let ignore = false
    const generation = loadGenerationRef.current
    const isCurrent = () =>
      !ignore &&
      mountedRef.current &&
      activeContextRef.current === context &&
      loadGenerationRef.current === generation

    void Promise.resolve().then(async () => {
      if (!isCurrent()) return

      savingItemsRef.current = new Set()
      setSavingItems(new Set())
      setMeals(mergeMealLogs([]))
      setLoadError(null)
      setSaveError(null)
      setLoading(true)

      const logs = await fetchMealLogs(selectedDate)
      if (!isCurrent()) return

      if (logs === null) {
        setLoadError('No pudimos cargar tu registro de hoy.')
      } else {
        setMeals(mergeMealLogs(logs))
      }

      setLoadedContext(context)
      readyRef.current = logs !== null
      setLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [context, selectedDate])

  async function retryLoad() {
    if (!mountedRef.current || activeContextRef.current !== context) return
    const requestDate = selectedDate
    // A reload must not leave item locks owned by an obsolete generation.
    if (savingItemsRef.current.size > 0) return
    const generation = ++loadGenerationRef.current
    readyRef.current = false
    setLoadError(null)
    setLoading(true)

    const logs = await fetchMealLogs(requestDate)

    if (
      !mountedRef.current ||
      activeContextRef.current !== context ||
      loadGenerationRef.current !== generation
    ) {
      return
    }

    if (logs === null) {
      setLoadError('No pudimos cargar tu registro de hoy.')
    } else {
      setMeals(mergeMealLogs(logs))
    }

    setLoadedContext(context)
    readyRef.current = logs !== null
    setLoading(false)
  }

  async function toggleMealItem(mealId: string, itemId: string) {
    const operationDate = selectedDate
    const operationGeneration = loadGenerationRef.current
    const isCurrentOperation = () =>
      mountedRef.current &&
      activeContextRef.current === context &&
      loadGenerationRef.current === operationGeneration
    if (!isCurrentOperation() || !readyRef.current) return
    const key = getItemKey(mealId, itemId)

    if (savingItemsRef.current.has(key)) return

    const currentItem = meals
      .find((meal) => meal.id === mealId)
      ?.items.find((item) => item.id === itemId)

    if (!currentItem) return

    const previousCompleted = currentItem.completed
    const nextCompleted = !previousCompleted

    savingItemsRef.current.add(key)
    setSavingItems((current) => {
      const next = new Set(current)
      next.add(key)
      return next
    })
    setSaveError(null)
    setMeals((currentMeals) =>
      currentMeals.map((meal) =>
        meal.id !== mealId
          ? meal
          : {
              ...meal,
              items: meal.items.map((item) =>
                item.id === itemId
                  ? { ...item, completed: nextCompleted }
                  : item,
              ),
            },
      ),
    )

    function rollbackChange() {
      if (!isCurrentOperation()) {
        return
      }
      setMeals((currentMeals) =>
        currentMeals.map((meal) =>
          meal.id !== mealId
            ? meal
            : {
                ...meal,
                items: meal.items.map((item) =>
                  item.id === itemId
                    ? { ...item, completed: previousCompleted }
                    : item,
                ),
              },
        ),
      )
      setSaveError('No pudimos guardar este cambio. Intentá nuevamente.')
    }

    try {
      const { error } = await supabase.from('meal_item_logs').upsert(
        {
          log_date: operationDate,
          meal_id: mealId,
          item_id: itemId,
          completed: nextCompleted,
        },
        {
          onConflict: 'user_id,log_date,meal_id,item_id',
        },
      )

      if (error) {
        rollbackChange()
      }
    } catch {
      rollbackChange()
    } finally {
      if (isCurrentOperation()) {
        savingItemsRef.current.delete(key)
        setSavingItems((current) => {
          const next = new Set(current)
          next.delete(key)
          return next
        })
      }
    }
  }

  const totalMeals = meals.length
  const completedMeals = meals.filter((meal) =>
    meal.items.every((item) => item.completed),
  ).length
  const progress =
    totalMeals > 0
      ? Math.round((completedMeals / totalMeals) * 100)
      : 0

  return {
    meals,
    totalMeals,
    completedMeals,
    progress,
    loading: loading || loadedContext !== context,
    loadError,
    saveError,
    savingItems,
    retryLoad,
    toggleMealItem,
  }
}
