interface PeriodSelectorProps {
  view: 'week' | 'month'
  onChange: (view: 'week' | 'month') => void
}

function PeriodSelector({ view, onChange }: PeriodSelectorProps) {
  return (
    <div className="grid grid-cols-2 rounded-button border border-border bg-surface p-1 shadow-soft" role="group" aria-label="Período de progreso">
      {(['week', 'month'] as const).map((option) => (
        <button key={option} type="button" aria-pressed={view === option} onClick={() => onChange(option)} className={`min-h-11 rounded-button px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${view === option ? 'bg-navy text-surface' : 'text-muted-foreground hover:bg-background hover:text-navy'}`}>
          {option === 'week' ? 'Semana' : 'Mes'}
        </button>
      ))}
    </div>
  )
}
export default PeriodSelector
