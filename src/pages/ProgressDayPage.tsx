import { useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import GymDayHistory from '../components/progress/GymDayHistory'
import HistoricalDayHeader from '../components/progress/HistoricalDayHeader'
import MealsDayContent from '../components/meals/MealsDayContent'
import WaterDayContent from '../components/water/WaterDayContent'
import { useGymHistoryForDate } from '../hooks/useGymHistoryForDate'
import { useMealsForDate } from '../hooks/useMealsForDate'
import { useWaterForDate } from '../hooks/useWaterForDate'
import { useLocalDay } from '../day/LocalDayProvider'
import { compareLocalDates, parseLocalCalendarDate } from '../utils/localDate'
import { getWeek } from '../utils/weekDates'
import { shiftMonthStart } from '../utils/monthDates'

function ProgressDayPage() {
  const { date: routeDate } = useParams<{ date: string }>()
  const { localDate: currentLocalDate } = useLocalDay()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const validation = useMemo(() => {
    if (!routeDate) return { date: null, error: 'No encontramos una fecha válida.' }
    try { parseLocalCalendarDate(routeDate); return { date: routeDate, error: null } }
    catch { return { date: null, error: 'La fecha indicada no es válida.' } }
  }, [routeDate])
  // Keep invalid route input out of every data hook; never turn it into today.
  const selectedDate = validation.date ?? '__invalid_calendar_date__'
  const isFuture = validation.date !== null && compareLocalDates(selectedDate, currentLocalDate) > 0
  const isToday = validation.date !== null && selectedDate === currentLocalDate
  const periodHref = useMemo(() => {
    if (!validation.date) return '/progreso'
    const selectedWeek = getWeek(selectedDate, currentLocalDate)
    const fromWeek = searchParams.get('from') === 'week'
    const contextWeek = searchParams.get('week')
    if (fromWeek && contextWeek) {
      try {
        const contextStart = getWeek(contextWeek, currentLocalDate).startDateString
        if (contextStart === contextWeek) return `/progreso?view=week&date=${contextWeek}`
      } catch { /* fall through to the date's canonical week */ }
    }
    const fromMonth = searchParams.get('from') === 'month'
    const contextMonth = searchParams.get('month')
    if (fromMonth && contextMonth) {
      try {
        if (shiftMonthStart(contextMonth, 0) === contextMonth &&
            shiftMonthStart(selectedDate, 0) === contextMonth) {
          return `/progreso?view=month&date=${contextMonth}`
        }
      } catch { /* fall through to the date's canonical week */ }
    }
    return `/progreso?view=week&date=${selectedWeek.startDateString}`
  }, [currentLocalDate, searchParams, selectedDate, validation.date])
  const meals = useMealsForDate(selectedDate)
  const water = useWaterForDate(selectedDate)
  const gym = useGymHistoryForDate(selectedDate)
  const dateLabel = validation.date
    ? new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseLocalCalendarDate(selectedDate))
    : ''
  const combined = Math.round((meals.progress + water.progress) / 2)
  const hasVisibleActivity = meals.meals.some((meal) =>
    meal.items.some((item) => item.completed),
  ) || water.entries.length > 0 || (gym.data?.sessions.length ?? 0) > 0 || Boolean(gym.data?.activeSession)

  function goToToday() { navigate(`/progreso/dia/${currentLocalDate}`) }
  if (!validation.date) return <section className="rounded-card border border-coral/25 bg-surface p-5 shadow-soft"><h1 className="text-xl font-semibold text-navy">Fecha inválida</h1><p className="mt-2 text-sm text-muted-foreground">{validation.error}</p><Link to="/progreso" className="mt-4 inline-flex min-h-11 items-center rounded-button bg-mint px-5 text-sm font-semibold text-navy">Volver al progreso</Link></section>
  if (isFuture) return <div className="space-y-5"><HistoricalDayHeader dateLabel={dateLabel} isToday={false} periodHref={periodHref} /><section className="rounded-card border border-border bg-surface p-5 shadow-soft"><p className="text-sm text-muted-foreground">Esta fecha todavía no llegó.</p><button type="button" onClick={goToToday} className="mt-4 min-h-11 rounded-button bg-mint px-5 py-2 text-sm font-semibold text-navy">Volver a hoy</button></section></div>

  return <div className="space-y-5">
    <HistoricalDayHeader dateLabel={dateLabel} isToday={isToday} periodHref={periodHref} />
    {!isToday ? <button type="button" onClick={goToToday} className="min-h-11 rounded-button border border-border bg-surface px-4 text-sm font-semibold text-navy hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">Volver a hoy</button> : null}
    {!meals.loading && !water.loading && !gym.loading && !hasVisibleActivity ? <p className="text-center text-sm text-muted-foreground">No hay registros para este día.</p> : null}
    <section className="rounded-card border border-border bg-surface p-5 shadow-soft"><h2 className="text-lg font-semibold text-navy">Resumen del día</h2><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-xl font-bold text-navy">{meals.progress}%</p><p className="text-xs text-muted-foreground">Comidas</p></div><div><p className="text-xl font-bold text-navy">{water.progress}%</p><p className="text-xs text-muted-foreground">Agua</p></div><div><p className="text-xl font-bold text-navy">{combined}%</p><p className="text-xs text-muted-foreground">Combinado</p></div></div></section>
    {meals.loading ? <Loading text="Cargando comidas…" /> : meals.loadError ? <ErrorBox message={meals.loadError} onRetry={() => void meals.retryLoad()} /> : <section><h2 className="mb-3 text-lg font-semibold text-navy">Comidas</h2><MealsDayContent {...meals} /></section>}
    {water.loading ? <Loading text="Cargando hidratación…" /> : water.loadError ? <ErrorBox message={water.loadError} onRetry={() => void water.retryLoad()} /> : <section><h2 className="mb-3 text-lg font-semibold text-navy">Agua</h2><p className="mb-3 text-xs text-muted-foreground">Las horas de las cargas reflejan el momento del registro, no necesariamente el momento en que tomaste el agua.</p><WaterDayContent {...water} /></section>}
    {gym.loading ? <Loading text="Cargando Gym…" /> : gym.error ? <ErrorBox message={gym.error} onRetry={() => void gym.retry()} /> : <GymDayHistory sessions={gym.data?.sessions ?? []} activeSession={gym.data?.activeSession ?? false} />}
  </div>
}

function Loading({ text }: { text: string }) { return <div role="status" aria-live="polite" className="rounded-card border border-border bg-surface p-5 text-sm text-muted-foreground shadow-soft">{text}</div> }
function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="rounded-card border border-coral/25 bg-surface p-5 shadow-soft"><p role="alert" className="text-sm font-medium text-navy">{message}</p><button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-button bg-mint px-5 py-2 text-sm font-semibold text-navy">Reintentar</button></div> }
export default ProgressDayPage
