import { prisma } from './prisma'
import { sendBookingCancellation } from './email'

const DEPOSIT_HOLD_MS = 15 * 60_000

// Bookings that required a deposit and never got paid are only ever holding
// the slot as PENDING (a successful payment flips them to CONFIRMED, see
// routes/payment.ts) — so any deposit-required booking still PENDING past
// the hold window was simply abandoned by the customer. Release the slot.
async function runDepositExpirySweep() {
  const threshold = new Date(Date.now() - DEPOSIT_HOLD_MS)

  const staleBookings = await prisma.booking.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lte: threshold },
      OR: [
        { service: { depositAmount: { gt: 0 } } },
        { resource: { depositAmount: { gt: 0 } } },
      ],
    },
    include: {
      customer: { select: { email: true } },
      business: true,
      resource: { select: { name: true } },
      service: { select: { name: true } },
    },
  })

  for (const booking of staleBookings) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } })
    if (booking.customer.email) {
      await sendBookingCancellation(booking, booking.business, booking.customer.email).catch(console.error)
    }
  }
}

let sweeping = false
let intervalHandle: ReturnType<typeof setInterval> | null = null

export function startDepositExpiryScheduler(intervalMs = 60_000) {
  if (intervalHandle) return

  const tick = () => {
    if (sweeping) return
    sweeping = true
    runDepositExpirySweep()
      .catch(err => console.error('[deposit-expiry] sweep failed', err))
      .finally(() => { sweeping = false })
  }

  tick()
  intervalHandle = setInterval(tick, intervalMs)
}
