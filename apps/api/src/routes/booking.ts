import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, Prisma } from '../lib/prisma'
import { sendBookingConfirmation, sendBookingCancellation, sendNewBookingAlert } from '../lib/email'
import { zonedTimeToUtc } from '../lib/datetime'

const isValidDate = (s: string) => !isNaN(Date.parse(s))

const createBookingSchema = z.object({
  resourceId: z.string().min(1),
  serviceId: z.string().optional(),
  startAt: z.string().refine(isValidDate, { message: 'Неверный формат даты startAt' }),
  endAt: z.string().refine(isValidDate, { message: 'Неверный формат даты endAt' }),
  guestCount: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
}).refine(d => new Date(d.startAt) < new Date(d.endAt), {
  message: 'startAt должно быть раньше endAt',
})

const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
})

export async function bookingRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const body = createBookingSchema.safeParse(request.body)
    if (!body.success) {
      const msg = body.error.errors[0]?.message ?? 'Неверные данные'
      return reply.status(400).send({ error: msg })
    }

    const resource = await prisma.resource.findUnique({
      where: { id: body.data.resourceId, isActive: true },
      include: { business: true },
    })
    if (!resource) return reply.status(404).send({ error: 'Ресурс не найден или неактивен' })

    // startAt/endAt arrive as naive "YYYY-MM-DDTHH:mm" wall-clock strings
    // (same value shown to the customer in the slot picker) — interpret them
    // in the business's own timezone, not the server process's timezone.
    const startAt = zonedTimeToUtc(body.data.startAt, resource.business.timezone)
    const endAt = zonedTimeToUtc(body.data.endAt, resource.business.timezone)

    // Prevent past bookings
    if (startAt <= new Date()) {
      return reply.status(400).send({ error: 'Нельзя забронировать прошедшую дату' })
    }

    if (resource.business.subscriptionPlan === 'FREE') {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
      const monthlyCount = await prisma.booking.count({
        where: { resource: { businessId: resource.businessId }, createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
      })
      if (monthlyCount >= 50) return reply.status(403).send({ error: 'Бизнес достиг лимита 50 броней/мес на Free-тарифе.' })
    }

    // Validate guest count against capacity
    if (body.data.guestCount && resource.capacity && body.data.guestCount > resource.capacity) {
      return reply.status(400).send({ error: `Максимальная вместимость: ${resource.capacity} чел.` })
    }

    // Validate service belongs to same business
    if (body.data.serviceId) {
      const service = await prisma.service.findUnique({ where: { id: body.data.serviceId } })
      if (!service || service.businessId !== resource.businessId) {
        return reply.status(400).send({ error: 'Услуга не найдена' })
      }
    }

    // Atomic conflict check + create to prevent double-booking
    let booking
    try {
      booking = await prisma.$transaction(async (tx) => {
        const conflict = await tx.booking.findFirst({
          where: {
            resourceId: body.data.resourceId,
            status: { in: ['PENDING', 'CONFIRMED'] },
            AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
          },
        })
        if (conflict) throw Object.assign(new Error('Это время уже занято'), { code: 'CONFLICT' })

        return tx.booking.create({
          data: {
            customerId: payload.sub,
            businessId: resource.businessId,
            resourceId: body.data.resourceId,
            serviceId: body.data.serviceId,
            startAt,
            endAt,
            guestCount: body.data.guestCount ?? 1,
            notes: body.data.notes,
          },
          include: {
            resource: { select: { name: true } },
            service: { select: { name: true } },
            business: { select: { name: true, slug: true } },
          },
        })
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (err: any) {
      if (err.code === 'CONFLICT') return reply.status(409).send({ error: err.message })
      throw err
    }

    // Fire-and-forget emails
    Promise.all([
      prisma.user.findUnique({ where: { id: payload.sub }, select: { email: true, name: true, phone: true } }),
      prisma.user.findUnique({ where: { id: resource.business.ownerId }, select: { email: true } }),
    ]).then(([customer, owner]) => {
      if (customer) {
        const full = { ...booking, customer }
        if (customer.email) sendBookingConfirmation(full, resource.business, customer.email).catch(console.error)
        if (owner?.email) sendNewBookingAlert(full, owner.email).catch(console.error)
      }
    }).catch(console.error)

    return reply.status(201).send(booking)
  })

  app.get('/my', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number }
    const skip = (Number(page) - 1) * Number(limit)

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { customerId: payload.sub },
        include: {
          resource: { select: { name: true } },
          service: { select: { name: true, price: true } },
          business: { select: { id: true, name: true, slug: true, type: true } },
          payment: { select: { status: true, amount: true, paidAt: true } },
        },
        orderBy: { startAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.booking.count({ where: { customerId: payload.sub } }),
    ])
    return reply.send({ bookings, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) })
  })

  app.get('/business/:businessId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { businessId } = request.params as { businessId: string }

    const business = await prisma.business.findUnique({ where: { id: businessId } })
    if (!business) return reply.status(404).send({ error: 'Business not found' })
    if (business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const query = request.query as { date?: string; status?: string }
    const bookings = await prisma.booking.findMany({
      where: {
        businessId,
        ...(query.status ? { status: query.status as any } : {}),
        ...(query.date ? {
          startAt: {
            gte: new Date(`${query.date}T00:00:00`),
            lt: new Date(new Date(`${query.date}T00:00:00`).getTime() + 86400000),
          },
        } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        resource: { select: { name: true } },
        service: { select: { name: true, price: true } },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { startAt: 'asc' },
    })
    return reply.send(bookings)
  })

  app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        resource: true,
        service: true,
        business: true,
        payment: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    })
    if (!booking) return reply.status(404).send({ error: 'Booking not found' })

    const isCustomer = booking.customerId === payload.sub
    const isOwner = booking.business.ownerId === payload.sub
    if (!isCustomer && !isOwner) return reply.status(403).send({ error: 'Forbidden' })

    return reply.send(booking)
  })

  app.patch('/:id/status', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const body = updateStatusSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Неверный статус' })

    const booking = await prisma.booking.findUnique({ where: { id }, include: { business: true } })
    if (!booking) return reply.status(404).send({ error: 'Booking not found' })

    const isCustomer = booking.customerId === payload.sub
    const isOwner = booking.business.ownerId === payload.sub
    if (!isCustomer && !isOwner) return reply.status(403).send({ error: 'Forbidden' })

    // Check terminal states BEFORE role restrictions (better error message)
    if (booking.status === 'CANCELLED') {
      return reply.status(400).send({ error: 'Отменённую бронь нельзя изменить' })
    }
    if (booking.status === 'COMPLETED') {
      return reply.status(400).send({ error: 'Завершённую бронь нельзя изменить' })
    }

    // Customers can only cancel their own bookings
    if (isCustomer && !isOwner && body.data.status !== 'CANCELLED') {
      return reply.status(403).send({ error: 'Можно только отменить бронь' })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: body.data.status },
      include: {
        resource: { select: { name: true } },
        service: { select: { name: true } },
      },
    })

    if (body.data.status === 'CANCELLED') {
      const [customer, biz] = await Promise.all([
        prisma.user.findUnique({ where: { id: booking.customerId }, select: { email: true } }),
        prisma.business.findUnique({ where: { id: booking.businessId } }),
      ])
      if (customer?.email && biz) sendBookingCancellation(updated, biz, customer.email).catch(console.error)
    }

    return reply.send(updated)
  })

  // POST /owner — owner manually creates a booking or blocks a time slot
  app.post('/owner', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }

    const ownerBookingSchema = z.object({
      resourceId:  z.string().min(1),
      startAt:     z.string().refine(isValidDate, { message: 'Неверный формат даты startAt' }),
      endAt:       z.string().refine(isValidDate, { message: 'Неверный формат даты endAt' }),
      source:      z.enum(['MANUAL', 'BLOCK']).default('MANUAL'),
      serviceId:   z.string().optional(),
      guestName:   z.string().max(100).optional(),
      guestPhone:  z.string().max(30).optional(),
      notes:       z.string().max(500).optional(),
      guestCount:  z.number().int().positive().optional(),
    }).refine(d => new Date(d.startAt) < new Date(d.endAt), {
      message: 'startAt должно быть раньше endAt',
    })

    const body = ownerBookingSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: body.error.errors[0]?.message ?? 'Неверные данные' })
    }

    // Verify resource belongs to this owner
    const resource = await prisma.resource.findUnique({
      where: { id: body.data.resourceId, isActive: true },
      include: { business: true },
    })
    if (!resource) return reply.status(404).send({ error: 'Ресурс не найден' })
    if (resource.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Нет доступа' })

    // startAt/endAt arrive as naive "YYYY-MM-DDTHH:mm" wall-clock strings from
    // the owner's date+time inputs — interpret them in the business's own
    // timezone, not the server process's timezone (see zonedTimeToUtc).
    const startAt = zonedTimeToUtc(body.data.startAt, resource.business.timezone)
    const endAt   = zonedTimeToUtc(body.data.endAt, resource.business.timezone)

    // Atomic conflict check + create
    let booking
    try {
      booking = await prisma.$transaction(async (tx) => {
        const conflict = await tx.booking.findFirst({
          where: {
            resourceId: body.data.resourceId,
            status: { in: ['PENDING', 'CONFIRMED'] },
            AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
          },
        })
        if (conflict) throw Object.assign(new Error('Это время уже занято'), { code: 'CONFLICT' })

        return tx.booking.create({
          data: {
            customerId: payload.sub,
            businessId: resource.businessId,
            resourceId: body.data.resourceId,
            serviceId:  body.data.serviceId,
            status:     'CONFIRMED',
            source:     body.data.source,
            startAt,
            endAt,
            guestCount: body.data.guestCount ?? 1,
            notes:      body.data.notes,
            guestName:  body.data.guestName,
            guestPhone: body.data.guestPhone,
          },
          include: {
            resource: { select: { name: true } },
            service:  { select: { name: true } },
            business: { select: { name: true, slug: true } },
            customer: { select: { id: true, name: true } },
          },
        })
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (err: any) {
      if (err.code === 'CONFLICT') return reply.status(409).send({ error: err.message })
      throw err
    }
    return reply.status(201).send(booking)
  })

  // DELETE /:id — owner deletes a manual/block booking
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { business: true },
    })
    if (!booking) return reply.status(404).send({ error: 'Бронь не найдена' })
    if (booking.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Нет доступа' })

    // Only allow deleting MANUAL/BLOCK bookings (online bookings must go through cancel flow)
    if (booking.source === 'ONLINE') {
      return reply.status(400).send({ error: 'Онлайн-брони нельзя удалять, используйте отмену' })
    }

    await prisma.booking.delete({ where: { id } })
    return reply.send({ ok: true })
  })

  // PATCH /:id/reschedule — move booking to a new time slot (owner only)
  app.patch('/:id/reschedule', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }

    const rescheduleSchema = z.object({
      startAt: z.string().refine(isValidDate, { message: 'Неверный формат даты' }),
      endAt: z.string().refine(isValidDate, { message: 'Неверный формат даты' }),
    }).refine(d => new Date(d.startAt) < new Date(d.endAt), { message: 'startAt должно быть раньше endAt' })

    const body = rescheduleSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.errors[0]?.message ?? 'Неверные данные' })

    const booking = await prisma.booking.findUnique({ where: { id }, include: { business: true } })
    if (!booking) return reply.status(404).send({ error: 'Бронь не найдена' })

    const isOwner = booking.business.ownerId === payload.sub
    const isCustomer = booking.customerId === payload.sub
    if (!isOwner && !isCustomer) return reply.status(403).send({ error: 'Нет доступа' })

    if (booking.status === 'CANCELLED') return reply.status(400).send({ error: 'Отменённую бронь нельзя перенести' })
    if (booking.status === 'COMPLETED') return reply.status(400).send({ error: 'Завершённую бронь нельзя перенести' })

    const startAt = new Date(body.data.startAt)
    const endAt = new Date(body.data.endAt)

    if (startAt <= new Date()) return reply.status(400).send({ error: 'Нельзя перенести на прошедшую дату' })

    // Check conflicts (exclude self)
    const conflict = await prisma.booking.findFirst({
      where: {
        resourceId: booking.resourceId,
        id: { not: id },
        status: { in: ['PENDING', 'CONFIRMED'] },
        AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
      },
    })
    if (conflict) return reply.status(409).send({ error: 'Это время уже занято' })

    const updated = await prisma.booking.update({
      where: { id },
      data: { startAt, endAt },
      include: {
        resource: { select: { name: true } },
        service: { select: { name: true } },
        business: { select: { name: true, slug: true } },
      },
    })
    return reply.send(updated)
  })
}
