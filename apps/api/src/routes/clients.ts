import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

interface ClientEntry {
  key: string
  userId: string | null
  name: string
  phone: string | null
  email: string | null
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  noShowBookings: number
  upcomingBookings: number
  totalPaid: number
  firstBookingAt: string
  lastBookingAt: string
}

export async function clientRoutes(app: FastifyInstance) {
  // Business owner: everyone they've interacted with via a booking — both
  // registered customers (source=ONLINE, keyed by User) and walk-ins the
  // owner recorded manually (source=MANUAL, keyed by guestPhone/guestName —
  // BLOCK bookings and manual entries with no guest info at all are excluded,
  // they're not real customer interactions).
  app.get('/business/:businessId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { businessId } = request.params as { businessId: string }
    const { search } = request.query as { search?: string }

    const business = await prisma.business.findUnique({ where: { id: businessId } })
    if (!business) return reply.status(404).send({ error: 'Not found' })
    if (business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const bookings = await prisma.booking.findMany({
      where: {
        businessId,
        OR: [
          { source: 'ONLINE' },
          { source: 'MANUAL', OR: [{ guestName: { not: null } }, { guestPhone: { not: null } }] },
        ],
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { startAt: 'asc' },
    })

    // Registered users who were also walked in manually under the same phone
    // number should be merged into one client entry, not counted twice.
    const guestPhones = [...new Set(
      bookings
        .filter(b => b.source === 'MANUAL' && b.guestPhone)
        .map(b => b.guestPhone as string),
    )]
    const matchedUsers = guestPhones.length
      ? await prisma.user.findMany({ where: { phone: { in: guestPhones } }, select: { id: true, name: true, phone: true, email: true } })
      : []
    const userByPhone = new Map(matchedUsers.map(u => [u.phone as string, u]))

    const now = new Date()
    const clients = new Map<string, ClientEntry>()

    for (const b of bookings) {
      let key: string
      let userId: string | null = null
      let name: string
      let phone: string | null
      let email: string | null

      if (b.source === 'ONLINE') {
        key = `user:${b.customer.id}`
        userId = b.customer.id
        name = b.customer.name
        phone = b.customer.phone
        email = b.customer.email
      } else {
        const matched = b.guestPhone ? userByPhone.get(b.guestPhone) : undefined
        if (matched) {
          key = `user:${matched.id}`
          userId = matched.id
          name = matched.name
          phone = matched.phone
          email = matched.email
        } else if (b.guestPhone) {
          key = `phone:${b.guestPhone}`
          name = b.guestName ?? b.guestPhone
          phone = b.guestPhone
          email = null
        } else {
          key = `name:${(b.guestName ?? '').trim().toLowerCase()}`
          name = b.guestName ?? '—'
          phone = null
          email = null
        }
      }

      let entry = clients.get(key)
      if (!entry) {
        entry = {
          key, userId, name, phone, email,
          totalBookings: 0, completedBookings: 0, cancelledBookings: 0, noShowBookings: 0, upcomingBookings: 0,
          totalPaid: 0, firstBookingAt: b.startAt.toISOString(), lastBookingAt: b.startAt.toISOString(),
        }
        clients.set(key, entry)
      }

      entry.totalBookings++
      if (b.status === 'COMPLETED') entry.completedBookings++
      if (b.status === 'CANCELLED') entry.cancelledBookings++
      if (b.status === 'NO_SHOW') entry.noShowBookings++
      if (b.startAt >= now && (b.status === 'PENDING' || b.status === 'CONFIRMED')) entry.upcomingBookings++
      if (b.payment?.status === 'PAID') entry.totalPaid += Number(b.payment.amount)
      if (b.startAt.toISOString() < entry.firstBookingAt) entry.firstBookingAt = b.startAt.toISOString()
      if (b.startAt.toISOString() > entry.lastBookingAt) entry.lastBookingAt = b.startAt.toISOString()
    }

    let result = [...clients.values()]
    if (search) {
      const q = search.trim().toLowerCase()
      result = result.filter(c => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q))
    }
    result.sort((a, b) => b.lastBookingAt.localeCompare(a.lastBookingAt))

    return reply.send({ clients: result, total: result.length })
  })
}
