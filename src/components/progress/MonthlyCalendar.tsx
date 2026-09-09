import type { CalendarMonth } from '../../utils/monthDates'

interface MonthlyCalendarProps {
  month: CalendarMonth
  progressByDate: ReadonlyMap<string, number | null>
  onDaySelect: (dateString: string) => void
}

function MonthlyCalendar({ month, progressByDate, onDaySelect }: MonthlyCalendarProps) {
  const monthName = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(month.startDate)
  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-soft">
      <h2 className="text-lg font-semibold text-navy">Calendario</h2>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold text-muted-foreground">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {month.cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} aria-hidden="true" className="aspect-square" />
          const progress = progressByDate.get(day.dateString) ?? null
          const hasProgress = progress !== null
          const label = `${day.fullLabel} ${day.date.getDate()} de ${monthName}: ${day.isFuture ? 'día futuro' : hasProgress ? `progreso ${progress} por ciento` : 'sin registros'}${day.isToday ? ', hoy' : ''}`
          return day.isFuture ? (
            <span key={day.dateString} aria-label={label} className="flex aspect-square flex-col items-center justify-center rounded-control text-muted-foreground/45"><span>{day.date.getDate()}</span><span aria-hidden="true" className="mt-1 size-1.5 rounded-full bg-border" /></span>
          ) : (
            <button key={day.dateString} type="button" onClick={() => onDaySelect(day.dateString)} aria-label={label} className={`flex aspect-square flex-col items-center justify-center rounded-control text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${day.isToday ? 'bg-navy text-surface' : 'text-navy hover:bg-mint/15'}`}><span>{day.date.getDate()}</span><span aria-hidden="true" className={`mt-1 size-1.5 rounded-full ${hasProgress ? progress === 0 ? 'bg-coral' : 'bg-mint' : 'bg-border'}`} /></button>
          )
        })}
      </div>
    </section>
  )
}
export default MonthlyCalendar
