import { beforeAll, describe, expect, it } from 'vitest'
import { api, assertServerReachable, loginTestPhone } from './helpers'
import { setupBusinessWithResource } from './setup'

// REGRESSION tests for a booking-integrity gap found during a full-platform QA
// pass (2026-07-08): POST /api/bookings only checks for overlap against
// EXISTING bookings — it never consults the resource's Schedule (open hours)
// or ScheduleException (closed/holiday days), even though GET /:id/slots
// already computes both correctly. Today you can book a resource at 3am on a
// day explicitly marked closed. See apps/api/src/routes/booking.ts.
const PHONE_OWNER = '+996700000018'
const PHONE_CUSTOMER = '+996700000019'

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

beforeAll(assertServerReachable)

describe('booking respects schedule and exceptions', () => {
  it('BUG: rejects a booking on a day marked closed via a schedule exception', async () => {
    const ownerJar = await loginTestPhone(PHONE_OWNER)
    const customerJar = await loginTestPhone(PHONE_CUSTOMER)
    const { resourceId } = await setupBusinessWithResource(ownerJar, { slugPrefix: 'qa-sched-closed' })

    const closedDate = daysFromNow(14)
    const exception = await api(`/api/resources/${resourceId}/exceptions`, {
      method: 'POST',
      jar: ownerJar,
      body: { date: closedDate, isClosed: true, reason: 'Holiday' },
    })
    expect(exception.status).toBe(201)

    // Sanity check: the slots endpoint (used by the UI) correctly reports no slots.
    const slots = await api(`/api/resources/${resourceId}/slots?date=${closedDate}`)
    expect(slots.json.slots).toEqual([])

    // BUG: booking creation doesn't check the exception at all and succeeds anyway.
    const booking = await api('/api/bookings', {
      method: 'POST',
      jar: customerJar,
      body: { resourceId, startAt: `${closedDate}T10:00`, endAt: `${closedDate}T11:00` },
    })
    expect(booking.status).not.toBe(201)
  })

  it('BUG: rejects a booking outside the resource\'s open hours', async () => {
    const ownerJar = await loginTestPhone(PHONE_OWNER)
    const customerJar = await loginTestPhone(PHONE_CUSTOMER)
    // Schedule is 08:00-20:00 daily (see setupBusinessWithResource).
    const { resourceId } = await setupBusinessWithResource(ownerJar, { slugPrefix: 'qa-sched-hours' })

    const date = daysFromNow(15)
    // Sanity check: slots endpoint has no 03:00 slot for this resource.
    const slots = await api(`/api/resources/${resourceId}/slots?date=${date}`)
    const has3am = (slots.json.slots as { start: string }[]).some(s => s.start === `${date}T03:00`)
    expect(has3am).toBe(false)

    // BUG: booking creation doesn't check open hours and succeeds anyway.
    const booking = await api('/api/bookings', {
      method: 'POST',
      jar: customerJar,
      body: { resourceId, startAt: `${date}T03:00`, endAt: `${date}T03:30` },
    })
    expect(booking.status).not.toBe(201)
  })
})
