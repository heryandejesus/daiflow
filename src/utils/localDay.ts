export function getMillisecondsUntilNextLocalDay(
  currentDate = new Date(),
): number {
  const nextDay = new Date(currentDate)
  nextDay.setHours(24, 0, 0, 50)

  return Math.max(0, nextDay.getTime() - currentDate.getTime())
}
