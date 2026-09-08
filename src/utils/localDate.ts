export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/** Parses a strict calendar date at local noon. Invalid dates throw RangeError. */
export function parseLocalCalendarDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError('Expected a calendar date in YYYY-MM-DD format.')
  }

  const [year, month, day] = value.split('-').map(Number)
  // setFullYear avoids the Date constructor's special handling of years 0–99.
  const date = new Date(2000, 0, 1, 12, 0, 0, 0)
  date.setFullYear(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new RangeError('The calendar date does not exist.')
  }

  return date
}

/** Adds calendar days, preserving local noon across daylight-saving changes. */
export function addLocalDays(value: string, amount: number): string {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError('The number of days must be a safe integer.')
  }

  const date = parseLocalCalendarDate(value)
  date.setDate(date.getDate() + amount)
  date.setHours(12, 0, 0, 0)
  const result = getLocalDateString(date).padStart(10, '0')
  // Also reject results outside the four-digit calendar year range.
  parseLocalCalendarDate(result)
  return result
}

/** Compares validated calendar dates, independently of timestamps. */
export function compareLocalDates(a: string, b: string): -1 | 0 | 1 {
  parseLocalCalendarDate(a)
  parseLocalCalendarDate(b)
  return a === b ? 0 : a < b ? -1 : 1
}
