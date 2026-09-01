import type { ReactNode } from 'react'
import BottomNav from '../navigation/BottomNav'

interface AppShellProps {
  children: ReactNode
  headerMeta?: ReactNode
  onSignOut?: () => void | Promise<void>
}

function AppShell({ children, headerMeta, onSignOut }: AppShellProps) {
  return (
    <div className="min-h-screen min-h-dvh bg-background text-foreground">
      <div className="relative mx-auto flex min-h-screen min-h-dvh w-full max-w-[440px] flex-col bg-background shadow-elevated">
        <header className="px-6 pb-6 pt-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-base font-semibold tracking-wide text-navy">
              DaiFlow
            </p>
            {onSignOut ? (
              <button
                type="button"
                onClick={() => void onSignOut()}
                className="min-h-11 rounded-button px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Salir
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-[1.375rem] font-semibold text-foreground">
            Buenos días, Dai ☀️
          </p>
          {headerMeta ? (
            <p className="mt-1 text-sm text-muted-foreground">{headerMeta}</p>
          ) : null}
        </header>

        <main className="flex-1 px-6 pb-[calc(9rem+env(safe-area-inset-bottom))]">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

export default AppShell
