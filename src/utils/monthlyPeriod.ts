import { compareLocalDates, parseLocalCalendarDate } from './localDate'
import { getMonth, shiftMonthStart } from './monthDates'

export function resolveMonthlyPeriod(search: string, currentLocalDate: string) {
  const params = new URLSearchParams(search)
  const currentStart = shiftMonthStart(currentLocalDate, 0)
  let start = currentStart
  const date = params.get('date')
  if (date !== null) {
    try {
      parseLocalCalendarDate(date)
      const candidate = shiftMonthStart(date, 0)
      if (compareLocalDates(candidate, currentStart) > 0) throw new RangeError('future')
      start = candidate
      params.set('view', 'month'); params.set('date', start)
    } catch {
      params.set('view', 'month'); params.delete('date')
    }
  } else {
    params.set('view', 'month')
  }
  return { startDate: start, currentMonthStart: currentStart, canonicalSearch: params.toString() }
}

export function getAdjacentMonthDate(monthStart: string, direction: -1 | 1, currentLocalDate: string) {
  const next = shiftMonthStart(monthStart, direction)
  return compareLocalDates(next, shiftMonthStart(currentLocalDate, 0)) <= 0 ? next : null
}

export { getMonth }
