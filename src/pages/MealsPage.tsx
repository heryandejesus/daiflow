import { useEffect, useRef, useState } from 'react'
import FoodSelectionGuide from '../components/meals/FoodSelectionGuide'
import MealCard from '../components/meals/MealCard'
import type { MealItem } from '../components/meals/MealCard'
import { mealPlan } from '../data/mealPlan'
import type { MealPlanEntry } from '../data/mealPlan'
import { useLocalDay } from '../day/LocalDayProvider'
import { supabase } from '../lib/supabase'

interface Meal extends Omit<MealPlanEntry, 'items'> {
  items: MealItem[]
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

async function fetchMealLogs(localDate: string) {
  try {
    const { data, error } = await supabase
      .from('meal_item_logs')
      .select('meal_id,item_id,completed')
      .eq('log_date', localDate)

    return error ? null : (data ?? [])
  } catch {
    return null
  }
}

function MealsPage() {
  const { localDate } = useLocalDay()
  const [meals, setMeals] = useState<Meal[]>(() => mergeMealLogs([]))
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savingItems, setSavingItems] = useState<Set<string>>(() => new Set())
  const savingItemsRef = useRef(new Set<string>())
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

      savingItemsRef.current = new Set()
      setSavingItems(new Set())
      setMeals(mergeMealLogs([]))
      setLoadError(null)
      setSaveError(null)
      setLoading(true)

      const logs = await fetchMealLogs(localDate)
      if (ignore) return

      if (logs === null) {
        setLoadError('No pudimos cargar tu registro de hoy.')
      } else {
        setMeals(mergeMealLogs(logs))
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

    const logs = await fetchMealLogs(requestDate)

    if (!mountedRef.current || currentLocalDateRef.current !== requestDate) {
      return
    }

    if (logs === null) {
      setLoadError('No pudimos cargar tu registro de hoy.')
    } else {
      setMeals(mergeMealLogs(logs))
    }

    setLoadedDate(requestDate)
    setLoading(false)
  }

  async function toggleMealItem(mealId: string, itemId: string) {
    const operationDate = localDate
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
      if (!mountedRef.current || currentLocalDateRef.current !== operationDate) {
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
      if (mountedRef.current && currentLocalDateRef.current === operationDate) {
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

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">
          Comidas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu plan de hoy</p>
      </section>

      {loading || loadedDate !== localDate ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-card border border-border bg-surface p-5 text-sm text-muted-foreground shadow-soft"
        >
          Cargando tu plan de hoy…
        </div>
      ) : loadError ? (
        <div className="rounded-card border border-coral/25 bg-surface p-5 shadow-soft">
          <p role="alert" className="text-sm font-medium text-navy">
            {loadError}
          </p>
          <button
            type="button"
            onClick={retryLoad}
            className="mt-4 min-h-11 rounded-button bg-mint px-5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-mint/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {saveError ? (
            <p
              role="alert"
              className="rounded-control border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-medium text-navy"
            >
              {saveError}
            </p>
          ) : null}

          <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <p aria-live="polite" className="font-semibold text-navy">
                {completedMeals} de {totalMeals} completadas
              </p>
              <p className="text-xl font-bold text-navy">{progress}%</p>
            </div>
            <div
              role="progressbar"
              aria-label="Progreso de comidas del día"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="mt-4 h-3 overflow-hidden rounded-button bg-mint/20"
            >
              <div
                className="h-full rounded-button bg-mint"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <div className="space-y-4">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                title={meal.title}
                icon={meal.icon}
                accent={meal.accent}
                items={meal.items}
                onToggleItem={(itemId) =>
                  void toggleMealItem(meal.id, itemId)
                }
                isItemSaving={(itemId) =>
                  savingItems.has(getItemKey(meal.id, itemId))
                }
              />
            ))}
          </div>

          <FoodSelectionGuide />
        </>
      )}
    </div>
  )
}

export default MealsPage
