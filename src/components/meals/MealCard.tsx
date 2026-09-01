import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MealAccent } from '../../data/mealPlan'

export interface MealItem {
  id: string
  label: string
  completed: boolean
}

interface MealCardProps {
  title: string
  icon: LucideIcon
  accent: MealAccent
  items: MealItem[]
  onToggleItem: (itemId: string) => void
  isItemSaving: (itemId: string) => boolean
}

const accentClasses = {
  yellow: {
    border: 'border-yellow/30',
    surface: 'bg-yellow/15',
    marker: 'bg-yellow text-navy',
  },
  coral: {
    border: 'border-coral/25',
    surface: 'bg-coral/15',
    marker: 'bg-coral text-navy',
  },
  mint: {
    border: 'border-mint/30',
    surface: 'bg-mint/20',
    marker: 'bg-mint text-navy',
  },
  lavender: {
    border: 'border-lavender/25',
    surface: 'bg-lavender/15',
    marker: 'bg-lavender text-navy',
  },
} as const

function MealCard({
  title,
  icon: Icon,
  accent,
  items,
  onToggleItem,
  isItemSaving,
}: MealCardProps) {
  const colors = accentClasses[accent]
  const completed = items.every((item) => item.completed)

  return (
    <article
      className={`rounded-card border bg-surface p-5 shadow-soft ${colors.border}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-11 items-center justify-center rounded-control text-navy ${colors.surface}`}
        >
          <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {completed ? 'Completada' : 'Pendiente'}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {items.map((item) => {
          const saving = isItemSaving(item.id)

          return (
            <li key={item.id}>
              <label
                className={`-mx-2 flex items-start gap-3 rounded-control px-2 py-1 transition-colors ${
                  saving
                    ? 'cursor-wait opacity-60'
                    : 'cursor-pointer hover:bg-background'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={saving}
                  onChange={() => onToggleItem(item.id)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-shadow peer-focus-visible:ring-2 peer-focus-visible:ring-navy peer-focus-visible:ring-offset-2 ${
                    item.completed
                      ? `${colors.border} ${colors.marker}`
                      : 'border-border bg-background'
                  }`}
                >
                  {item.completed ? (
                    <Check aria-hidden="true" className="size-3.5" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 text-sm leading-6 text-foreground">
                  {item.label}
                  {saving ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      Guardando…
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </article>
  )
}

export default MealCard
