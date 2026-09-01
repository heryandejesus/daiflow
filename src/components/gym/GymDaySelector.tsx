import type { GymWorkoutDay, GymWorkoutDayId } from '../../data/gymPlan'

interface GymDaySelectorProps {
  days: readonly GymWorkoutDay[]
  selectedDay: GymWorkoutDayId
  disabled?: boolean
  onSelect: (day: GymWorkoutDayId) => void
}

function GymDaySelector({
  days,
  selectedDay,
  disabled = false,
  onSelect,
}: GymDaySelectorProps) {
  return (
    <div
      role="group"
      className="grid grid-cols-2 gap-2"
      aria-label="Elegir rutina"
    >
      {days.map((day) => {
        const selected = day.id === selectedDay

        return (
          <button
            key={day.id}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onSelect(day.id)}
            className={`min-h-11 rounded-button border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60 ${
              selected
                ? 'border-navy bg-navy text-surface'
                : 'border-lavender/30 bg-surface text-navy hover:border-lavender/60 hover:bg-lavender/10'
            }`}
          >
            {day.title}
          </button>
        )
      })}
    </div>
  )
}

export default GymDaySelector
