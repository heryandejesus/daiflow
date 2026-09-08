import { addLocalDays, getLocalDateString, parseLocalCalendarDate } from './localDate'

export interface WeekDate {
  date: Date
  dateString: string
  shortLabel: string
  fullLabel: string
  isToday: boolean
  isFuture: boolean
}

export interface CurrentWeek {
  startDate: Date
  endDate: Date
  startDateString: string
  endDateString: string
  days: WeekDate[]
}

const shortLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const weekdayFormatter = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
})

/** The base selects the period; only currentLocalDate determines today/future. */
export function getWeek(baseDate: string, currentLocalDate: string): CurrentWeek {
  const referenceDate = parseLocalCalendarDate(baseDate)
  parseLocalCalendarDate(currentLocalDate)
  const normalizedDay = referenceDate.getDay() || 7
  const daysSinceMonday = normalizedDay - 1
  const mondayString = addLocalDays(baseDate, -daysSinceMonday)

  const days = shortLabels.map((shortLabel, index) => {
    const dateString = addLocalDays(mondayString, index)
    const date = parseLocalCalendarDate(dateString)

    return {
      date,
      dateString,
      shortLabel,
      fullLabel: weekdayFormatter.format(date),
      isToday: dateString === currentLocalDate,
      isFuture: dateString > currentLocalDate,
    }
  })

  return {
    startDate: new Date(days[0].date),
    endDate: new Date(days[6].date),
    startDateString: days[0].dateString,
    endDateString: days[6].dateString,
    days,
  }
}

/** Compatibility wrapper: the reference date is both the base and today. */
export function getCurrentWeek(referenceDate = new Date()): CurrentWeek {
  const localDate = getLocalDateString(referenceDate).padStart(10, '0')
  return getWeek(localDate, localDate)
}
