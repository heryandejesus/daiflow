import { addLocalDays, compareLocalDates, parseLocalCalendarDate } from './localDate'
import { getWeek } from './weekDates'
import type { CurrentWeek } from './weekDates'

/** No date means a live current week; an explicit date remains pinned. */
export function resolveWeeklyPeriod(search: string, currentLocalDate: string) {
  const params = new URLSearchParams(search)
  const currentWeek = getWeek(currentLocalDate, currentLocalDate)
  let baseDate = currentWeek.startDateString
  const explicitDate = params.get('date')

  if (explicitDate !== null) {
    try {
      parseLocalCalendarDate(explicitDate)
      const selectedWeek = getWeek(explicitDate, currentLocalDate)
      if (compareLocalDates(selectedWeek.startDateString, baseDate) > 0) {
        throw new RangeError('Future weeks are not available.')
      }
      baseDate = selectedWeek.startDateString
      params.set('view', 'week')
      params.set('date', baseDate)
    } catch {
      // Invalid or unsupported calendar dates never reach rendering or queries.
      params.delete('date')
      params.delete('view')
    }
  } else if (params.has('view')) {
    params.set('view', 'week')
  }

  return {
    baseDate,
    currentWeekStart: currentWeek.startDateString,
    canonicalSearch: params.toString(),
  }
}

export function getAdjacentWeekDate(
  weekStart: string,
  direction: -1 | 1,
  currentLocalDate: string,
): string | null {
  try {
    const next = getWeek(addLocalDays(weekStart, direction * 7), currentLocalDate)
    const current = getWeek(currentLocalDate, currentLocalDate)
    return compareLocalDates(next.startDateString, current.startDateString) <= 0
      ? next.startDateString
      : null
  } catch {
    // Also protects the lower/upper bounds of four-digit calendar years.
    return null
  }
}

const shortMonths = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function formatDayMonth(date: Date): string {
  return `${date.getDate()} ${shortMonths[date.getMonth()]}`
}

export function formatWeekRange(week: CurrentWeek, currentLocalDate: string): string {
  const { startDate, endDate } = week
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  if (startYear !== endYear) {
    return `${formatDayMonth(startDate)} ${startYear} — ${formatDayMonth(endDate)} ${endYear}`
  }

  const startLabel = startDate.getMonth() === endDate.getMonth()
    ? String(startDate.getDate())
    : formatDayMonth(startDate)
  const endLabel = endYear === parseLocalCalendarDate(currentLocalDate).getFullYear()
    ? formatDayMonth(endDate)
    : `${formatDayMonth(endDate)} ${endYear}`
  return `${startLabel} — ${endLabel}`
}
