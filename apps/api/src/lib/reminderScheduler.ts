import { prisma } from './prisma'
import { sendTelegramMessage, isTelegramConfigured } from './telegram'

function fmt(date: Date, opts: Intl.DateTimeFormatOptions) {
  return date.toLocaleString('ru', { timeZone: 'Asia/Bishkek', ...opts })
}

async function runReminderSweep() {
  if (!isTelegramConfigured()) return
  const now = new Date()

  const rules = await prisma.reminderRule.findMany({
    where: { isActive: true, business: { isActive: true, subscriptionActive: true } },
  })

  for (const rule of rules) {
    // A reminder fires once "now" reaches (booking start − offset). Using a
    // threshold check + a ReminderLog dedupe record (rather than a fixed time
    // window) makes this robust to the sweep interval and any downtime —
    // a booking just gets caught on the next sweep after its threshold passes.
    const threshold = new Date(now.getTime() + rule.offsetMinutes * 60_000)

    const bookings = await prisma.booking.findMany({
      where: {
        businessId: rule.businessId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startAt: { gt: now, lte: threshold },
        reminderLogs: { none: { ruleId: rule.id } },
      },
      include: {
        customer: { select: { telegramChatId: true, name: true } },
        resource: { select: { name: true } },
        service: { select: { name: true } },
        business: { select: { name: true } },
      },
    })

    for (const booking of bookings) {
      if (!booking.customer.telegramChatId) continue

      const date = fmt(booking.startAt, { day: 'numeric', month: 'long' })
      const time = fmt(booking.startAt, { hour: '2-digit', minute: '2-digit' })
      const text = [
        `🔔 <b>Напоминание: ${rule.label}</b>`,
        booking.business.name,
        `📅 ${date} в ${time}`,
        `📍 ${booking.resource.name}${booking.service ? ' · ' + booking.service.name : ''}`,
      ].join('\n')

      await sendTelegramMessage(booking.customer.telegramChatId, text)
      try {
        await prisma.reminderLog.create({ data: { bookingId: booking.id, ruleId: rule.id } })
      } catch {
        // Unique constraint race (concurrent sweep) — safe to ignore, already logged
      }
    }
  }
}

let sweeping = false
let intervalHandle: ReturnType<typeof setInterval> | null = null

export function startReminderScheduler(intervalMs = 5 * 60_000) {
  if (intervalHandle) return

  const tick = () => {
    if (sweeping) return
    sweeping = true
    runReminderSweep()
      .catch(err => console.error('[reminders] sweep failed', err))
      .finally(() => { sweeping = false })
  }

  tick()
  intervalHandle = setInterval(tick, intervalMs)
}
