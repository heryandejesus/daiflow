import { Link } from 'react-router-dom'

interface HistoricalDayHeaderProps {
  dateLabel: string
  isToday: boolean
  periodHref: string
}

function HistoricalDayHeader({ dateLabel, isToday, periodHref }: HistoricalDayHeaderProps) {
  return (
    <section className="rounded-card border border-lavender/30 bg-lavender/10 p-5 shadow-soft">
      <Link to={periodHref} className="inline-flex min-h-11 items-center rounded-button px-3 text-sm font-semibold text-navy hover:bg-surface/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
        ← Volver al período
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-navy">{dateLabel}</h1>
      <p className="mt-2 text-sm font-semibold text-navy">{isToday ? 'Hoy' : 'Historial'}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {isToday ? 'Registros de hoy' : 'Editando los registros de este día'}
      </p>
    </section>
  )
}

export default HistoricalDayHeader
