import {
  ChartNoAxesColumnIncreasing,
  Dumbbell,
  House,
  Utensils,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigationItems = [
  { label: 'Hoy', icon: House, to: '/' },
  { label: 'Comidas', icon: Utensils, to: '/comidas' },
  { label: 'Gym', icon: Dumbbell, to: '/gym' },
  {
    label: 'Progreso',
    icon: ChartNoAxesColumnIncreasing,
    to: '/progreso',
  },
]

function BottomNav() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[440px] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <nav
        aria-label="Navegación principal"
        className="pointer-events-auto grid grid-cols-4 rounded-card border border-border bg-surface px-2 py-2 shadow-soft"
      >
        {navigationItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            end
            className={({ isActive }) =>
              `flex min-h-16 flex-col items-center justify-center gap-1 rounded-control text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-mint/20 text-navy'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground'
              }`
            }
          >
            <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default BottomNav
