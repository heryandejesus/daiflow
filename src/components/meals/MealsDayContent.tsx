import MealCard from './MealCard'
import type { Meal } from '../../hooks/useMealsForDate'

interface MealsDayContentProps {
  meals: Meal[]
  totalMeals: number
  completedMeals: number
  progress: number
  saveError: string | null
  savingItems: ReadonlySet<string>
  toggleMealItem: (mealId: string, itemId: string) => Promise<void>
}

function MealsDayContent({
  meals,
  totalMeals,
  completedMeals,
  progress,
  saveError,
  savingItems,
  toggleMealItem,
}: MealsDayContentProps) {
  return (
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
              savingItems.has(`${meal.id}:${itemId}`)
            }
          />
        ))}
      </div>
    </>
  )
}

export default MealsDayContent
