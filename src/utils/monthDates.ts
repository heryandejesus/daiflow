import { addLocalDays, getLocalDateString, parseLocalCalendarDate } from './localDate'
import type { WeekDate } from './weekDates'

export interface CalendarMonth {
  startDate: Date
  endDate: Date
  startDateString: string
  endDateString: string
  days: WeekDate[]
  /** Monday–Sunday rows, with null padding outside the selected month. */
  cells: (WeekDate | null)[]
}

const shortLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const weekdayFormatter = new Intl.DateTimeFormat('es-AR', { weekday: 'long' })

/** Returns the first day of the displaced month, never overflowing from day 31. */
export function shiftMonthStart(baseDate: string, amount: number): string {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError('The number of months must be a safe integer.')
  }

  const date = parseLocalCalendarDate(baseDate)
  date.setDate(1)
  date.setMonth(date.getMonth() + amount)
  const result = getLocalDateString(date).padStart(10, '0')
  parseLocalCalendarDate(result)
  return result
}

export function getMonth(baseDate: string, currentLocalDate: string): CalendarMonth {
  const referenceDate = parseLocalCalendarDate(baseDate)
  parseLocalCalendarDate(currentLocalDate)
  const startDateString = shiftMonthStart(baseDate, 0)
  const startDate = parseLocalCalendarDate(startDateString)
  const endDate = new Date(referenceDate)
  endDate.setMonth(endDate.getMonth() + 1, 0)
  const endDateString = getLocalDateString(endDate).padStart(10, '0')
  const days = Array.from({ length: endDate.getDate() }, (_, index) => {
    const dateString = addLocalDays(startDateString, index)
    const date = parseLocalCalendarDate(dateString)
    return {
      date,
      dateString,
      shortLabel: shortLabels[(date.getDay() + 6) % 7],
      fullLabel: weekdayFormatter.format(date),
      isToday: dateString === currentLocalDate,
      isFuture: dateString > currentLocalDate,
    }
  })
  const leadingCells = (startDate.getDay() + 6) % 7
  const cellCount = Math.ceil((leadingCells + days.length) / 7) * 7
  const cells = Array.from(
    { length: cellCount },
    (_, index) => days[index - leadingCells] ?? null,
  )

  return { startDate, endDate, startDateString, endDateString, days, cells }
}
