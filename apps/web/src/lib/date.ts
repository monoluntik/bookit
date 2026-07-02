/**
 * Formats a Date using its LOCAL calendar fields (year/month/day), not UTC.
 * `date.toISOString().split('T')[0]` silently shifts by a day for any
 * timezone offset from UTC — e.g. in Bishkek (+06), local midnight becomes
 * 18:00 the previous day in UTC, so "today" would format as yesterday's
 * date. Always use this instead when formatting a Date built from local
 * calendar fields (`new Date()`, `new Date(y, m, d)`, `setHours`, `setDate`).
 */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Adds `days` to a "YYYY-MM-DD" date string, staying in local-calendar terms throughout. */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return toLocalDateStr(date)
}

/**
 * Parses a "YYYY-MM-DD" string as a local-midnight Date, not UTC midnight —
 * `new Date("YYYY-MM-DD")` parses as UTC per spec, which can display as the
 * previous/next day once rendered with `toLocaleDateString`/`toLocaleTimeString`
 * in a non-UTC timezone.
 */
export function parseLocalDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}
