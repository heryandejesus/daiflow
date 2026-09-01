import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import AppShell from './components/layout/AppShell'
import { useLocalDay } from './day/LocalDayProvider'
import GymPage from './pages/GymPage'
import LoginPage from './pages/LoginPage'
import MealsPage from './pages/MealsPage'
import ProgressPage from './pages/ProgressPage'
import TodayPage from './pages/TodayPage'
import WaterPage from './pages/WaterPage'

function AuthenticatedLayout() {
  const { pathname } = useLocation()
  const { signOut } = useAuth()
  const { currentDate } = useLocalDay()
  const headerDate = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(currentDate)

  return (
    <AppShell
      headerMeta={pathname === '/' ? headerDate : undefined}
      onSignOut={signOut}
    >
      <Outlet />
    </AppShell>
  )
}

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen min-h-dvh items-center justify-center bg-background px-6 text-sm font-medium text-muted-foreground"
      >
        Cargando…
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        element={
          session ? <AuthenticatedLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<TodayPage />} />
        <Route path="comidas" element={<MealsPage />} />
        <Route path="agua" element={<WaterPage />} />
        <Route path="gym" element={<GymPage />} />
        <Route path="progreso" element={<ProgressPage />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={session ? '/' : '/login'} replace />}
      />
    </Routes>
  )
}

export default App
