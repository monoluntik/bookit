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
