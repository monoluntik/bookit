const GMT_OFFSET_RE = /GMT([+-]\d{2}:\d{2})/

function offsetFor(timeZone: string, at: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(at)
  const tzPart = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+00:00'
  return GMT_OFFSET_RE.exec(tzPart)?.[1] ?? '+00:00'
}

/**
 * Interprets a naive "YYYY-MM-DDTHH:mm" wall-clock string as local time in
 * the given IANA timezone and returns the correct absolute instant.
 *
 * `new Date(naiveString)` parses using the server process's own timezone,
 * which is Asia/Bishkek in local dev but UTC on most cloud hosts (Railway) —
 * causing slot/booking times to silently shift by the zone's offset.
 */
export function zonedTimeToUtc(naive: string, timeZone: string): Date {
  const datePart = naive.slice(0, 10)
  const offset = offsetFor(timeZone, new Date(`${datePart}T12:00:00Z`))
  return new Date(`${naive}:00${offset}`)
}

/** Formats a UTC instant as a "YYYY-MM-DD" wall-clock date in the given IANA timezone. */
export function utcToLocalDateStr(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at)
}

/** The current wall-clock date ("YYYY-MM-DD") in the given IANA timezone, right now. */
export function todayInTimeZone(timeZone: string): string {
  return utcToLocalDateStr(new Date(), timeZone)
}

/** UTC instant for local midnight, "today" in the given timezone. */
export function localDayStart(timeZone: string): Date {
  return zonedTimeToUtc(`${todayInTimeZone(timeZone)}T00:00`, timeZone)
}

/** UTC instant for the 1st of the local month containing `at`, offset by `monthOffset` months. */
export function localMonthStart(at: Date, timeZone: string, monthOffset = 0): Date {
  const [y, m] = utcToLocalDateStr(at, timeZone).split('-').map(Number)
  const total = y * 12 + (m - 1) + monthOffset
  const year = Math.floor(total / 12)
  const month = ((total % 12) + 12) % 12
  return zonedTimeToUtc(`${year}-${String(month + 1).padStart(2, '0')}-01T00:00`, timeZone)
}
