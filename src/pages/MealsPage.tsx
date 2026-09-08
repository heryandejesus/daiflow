import FoodSelectionGuide from '../components/meals/FoodSelectionGuide'
import MealsDayContent from '../components/meals/MealsDayContent'
import { useLocalDay } from '../day/LocalDayProvider'
import { useMealsForDate } from '../hooks/useMealsForDate'

function MealsPage() {
  const { localDate: currentLocalDate } = useLocalDay()
  const meals = useMealsForDate(currentLocalDate)
  const { loading, loadError, retryLoad } = meals

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">
          Comidas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu plan de hoy</p>
      </section>

      {loading ? (
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
          <MealsDayContent {...meals} />
          <FoodSelectionGuide />
        </>
      )}
    </div>
  )
}

export default MealsPage
