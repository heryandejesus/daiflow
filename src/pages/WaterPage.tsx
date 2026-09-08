import WaterDayContent from '../components/water/WaterDayContent'
import { useLocalDay } from '../day/LocalDayProvider'
import { useWaterForDate } from '../hooks/useWaterForDate'

function WaterPage() {
  const { localDate: currentLocalDate } = useLocalDay()
  const water = useWaterForDate(currentLocalDate)
  const { loading, loadError, retryLoad } = water

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">
          Agua
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu hidratación de hoy
        </p>
      </section>

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-card border border-border bg-surface p-5 text-sm text-muted-foreground shadow-soft"
        >
          Cargando tu hidratación de hoy…
        </div>
      ) : loadError ? (
        <div className="rounded-card border border-coral/25 bg-surface p-5 shadow-soft">
          <p role="alert" className="text-sm font-medium text-navy">
            {loadError}
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
        <WaterDayContent {...water} />
      )}
    </div>
  )
}

export default WaterPage
