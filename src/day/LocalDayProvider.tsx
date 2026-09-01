import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getLocalDateString } from '../utils/localDate'
import { getMillisecondsUntilNextLocalDay } from '../utils/localDay'

interface LocalDayContextValue {
  currentDate: Date
  localDate: string
}

interface LocalDayProviderProps {
  children: ReactNode
}

const LocalDayContext = createContext<LocalDayContextValue | undefined>(
  undefined,
)

export function LocalDayProvider({ children }: LocalDayProviderProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const localDate = getLocalDateString(currentDate)

  useEffect(() => {
    let active = true
    let timeoutId: number | undefined

    function scheduleNextCheck() {
      if (!active) return

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }

      const now = new Date()
      timeoutId = window.setTimeout(
        checkDayAndReschedule,
        getMillisecondsUntilNextLocalDay(now),
      )
    }

    function checkDayAndReschedule() {
      if (!active) return

      const now = new Date()
      const nextLocalDate = getLocalDateString(now)

      setCurrentDate((storedDate) =>
        getLocalDateString(storedDate) === nextLocalDate ? storedDate : now,
      )
      scheduleNextCheck()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        checkDayAndReschedule()
      }
    }

    scheduleNextCheck()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', checkDayAndReschedule)
    window.addEventListener('pageshow', checkDayAndReschedule)

    return () => {
      active = false

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', checkDayAndReschedule)
      window.removeEventListener('pageshow', checkDayAndReschedule)
    }
  }, [])

  const value = useMemo(
    () => ({ currentDate, localDate }),
    [currentDate, localDate],
  )

  return (
    <LocalDayContext.Provider value={value}>
      {children}
    </LocalDayContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocalDay() {
  const context = useContext(LocalDayContext)

  if (context === undefined) {
    throw new Error('useLocalDay debe utilizarse dentro de LocalDayProvider.')
  }

  return context
}
