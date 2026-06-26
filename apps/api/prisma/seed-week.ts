/**
 * Seed next 7 days with realistic bookings for existing businesses.
 * Run: npx ts-node prisma/seed-week.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Config ────────────────────────────────────────────────────────────────────
const OASIS_BIZ     = 'cmqt80md90002zywybo1npvrb'
const OASIS_OWNER   = 'cmqt80mbj0000zywy2t96jjx6'
const OASIS_RES     = 'cmqt80vgj0004zywyim7g9der' // Мастер Аида, Mon-Sat 09-19, 60min slots

const CUSTOMERS = [
  { id: 'cmqt9h58m0000xkbh3suexuln', name: 'Элдияр' },
  { id: 'cmqt9qm4w0000fwzyyfuufr6z', name: 'Руслан' },
  { id: 'cmqtauz6u0001yw2qqssb7fsj', name: 'Test Customer' },
]

// Guest names for manual bookings
const GUEST_NAMES = [
  { name: 'Айгуль Асанова',    phone: '+996700111222' },
  { name: 'Манас Бектенов',    phone: '+996555333444' },
  { name: 'Гүлнара Сыдыкова', phone: '+996702777888' },
  { name: 'Адил Жунусов',      phone: '+996556999000' },
]

const NOTES = [
  'Постоянный клиент',
  'Первый визит',
  'Короткая стрижка',
  'Окрашивание в светлый',
  null,
]

function addHours(date: Date, h: number) {
  return new Date(date.getTime() + h * 3600_000)
}

function dateAtHour(baseDate: Date, hour: number, minute = 0) {
  const d = new Date(baseDate)
  d.setUTCHours(0, 0, 0, 0)
  // Convert to Bishkek UTC+6 by subtracting 6 hours to get UTC equivalent for 09:00 Bishkek
  const bishkekOffset = 6
  d.setUTCHours(hour - bishkekOffset, minute, 0, 0)
  return d
}

const STATUSES: Array<'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'> = [
  'CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  const now = new Date()
  const today = new Date(now)
  today.setUTCHours(0, 0, 0, 0)

  let created = 0
  let skipped = 0

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(today.getTime() + dayOffset * 86_400_000)
    const dow = day.getUTCDay() // 0=Sun
    // Мастер Аида works Mon(1)–Sat(6)
    if (dow === 0) continue // skip Sunday

    // Create 4-6 slots per day at 09, 11, 13, 15, 17 (skip some randomly)
    const hourSlots = [9, 10, 11, 13, 14, 15, 16, 17]
    const slotsForDay = hourSlots.filter(() => Math.random() > 0.35)

    for (const hour of slotsForDay) {
      const startAt = dateAtHour(day, hour)
      const endAt   = dateAtHour(day, hour + 1)

      // Skip past times
      if (endAt <= now) continue

      // Check conflict
      const conflict = await prisma.booking.findFirst({
        where: {
          resourceId: OASIS_RES,
          status: { in: ['PENDING', 'CONFIRMED'] },
          AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
        },
      })
      if (conflict) { skipped++; continue }

      // Decide: MANUAL, BLOCK (10% each), or regular ONLINE
      const rand = Math.random()
      let source: 'ONLINE' | 'MANUAL' | 'BLOCK'
      let status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

      if (rand < 0.08) {
        source = 'BLOCK'
        status = 'CONFIRMED'
        const booking = await prisma.booking.create({
          data: {
            customerId: OASIS_OWNER,
            businessId: OASIS_BIZ,
            resourceId: OASIS_RES,
            status,
            source,
            startAt,
            endAt,
            guestCount: 1,
            notes: pick(['Технический перерыв', 'Уборка', null] as any[]) ?? undefined,
          },
        })
        console.log(`  [BLOCK]   ${startAt.toISOString().slice(0,16)} ${booking.id.slice(-6)}`)
        created++
        continue
      }

      if (rand < 0.18) {
        source = 'MANUAL'
        status = dayOffset === 0 ? 'CONFIRMED' : pick(['CONFIRMED', 'CONFIRMED', 'PENDING'])
        const guest = pick(GUEST_NAMES)
        const booking = await prisma.booking.create({
          data: {
            customerId: OASIS_OWNER,
            businessId: OASIS_BIZ,
            resourceId: OASIS_RES,
            status,
            source,
            startAt,
            endAt,
            guestCount: 1,
            guestName:  guest.name,
            guestPhone: guest.phone,
            notes: pick(NOTES) ?? undefined,
          },
        })
        console.log(`  [MANUAL]  ${startAt.toISOString().slice(0,16)} ${guest.name}`)
        created++
        continue
      }

      // Regular ONLINE booking
      source = 'ONLINE'
      // Today's past slots can be COMPLETED
      status = dayOffset === 0 ? pick(['COMPLETED', 'CONFIRMED', 'CANCELLED'])
             : dayOffset < 3   ? pick(STATUSES)
             : pick(['PENDING', 'CONFIRMED', 'CONFIRMED'])

      const customer = pick(CUSTOMERS)
      const booking = await prisma.booking.create({
        data: {
          customerId: customer.id,
          businessId: OASIS_BIZ,
          resourceId: OASIS_RES,
          status,
          source,
          startAt,
          endAt,
          guestCount: 1,
          notes: pick(NOTES) ?? undefined,
        },
      })
      console.log(`  [ONLINE]  ${startAt.toISOString().slice(0,16)} ${customer.name} → ${status}`)
      created++
    }
  }

  console.log(`\n✓ Created ${created} bookings, skipped ${skipped} conflicts`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
