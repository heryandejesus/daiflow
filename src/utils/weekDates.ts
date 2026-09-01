import { getLocalDateString } from './localDate'

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

export function getCurrentWeek(referenceDate = new Date()): CurrentWeek {
  const today = new Date(referenceDate)
  today.setHours(12, 0, 0, 0)

  const normalizedDay = referenceDate.getDay() || 7
  const daysSinceMonday = normalizedDay - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysSinceMonday)

  const todayString = getLocalDateString(today)
  const days = shortLabels.map((shortLabel, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    date.setHours(12, 0, 0, 0)

    const dateString = getLocalDateString(date)

    return {
      date,
      dateString,
      shortLabel,
      fullLabel: weekdayFormatter.format(date),
      isToday: dateString === todayString,
      isFuture: dateString > todayString,
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
