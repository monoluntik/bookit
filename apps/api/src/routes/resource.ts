import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const createResourceSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
  staffMemberId: z.string().optional(),
})

const scheduleSchema = z.object({
  dayOfWeek: z.array(z.number().int().min(0).max(6)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDurationMinutes: z.number().int().positive().optional(),
}).refine(d => d.startTime < d.endTime, { message: 'startTime должно быть раньше endTime' })

export async function resourceRoutes(app: FastifyInstance) {
  // Protected: create resource
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const body = createResourceSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const business = await prisma.business.findUnique({ where: { id: body.data.businessId } })
    if (!business) return reply.status(404).send({ error: 'Business not found' })
    if (business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    if (business.subscriptionPlan === 'FREE') {
      const count = await prisma.resource.count({ where: { businessId: business.id } })
      if (count >= 3) return reply.status(403).send({ error: 'Free-тариф допускает до 3 ресурсов. Перейдите на Pro.' })
    }

    const { metadata: rMeta, ...rRest } = body.data
    const resource = await prisma.resource.create({
      data: { ...rRest, ...(rMeta ? { metadata: rMeta as any } : {}) },
    })
    return reply.status(201).send(resource)
  })

  // Protected: update resource images
  app.patch('/:id/images', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const body = request.body as { images: string[] }

    if (!Array.isArray(body?.images)) {
      return reply.status(400).send({ error: 'images must be an array' })
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { business: true },
    })
    if (!resource) return reply.status(404).send({ error: 'Resource not found' })
    if (resource.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const updated = await prisma.resource.update({
      where: { id },
      data: { images: body.images },
    })
    return reply.send(updated)
  })

  // Protected: add schedule to resource
  app.post('/:id/schedules', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const body = scheduleSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { business: true },
    })
    if (!resource) return reply.status(404).send({ error: 'Resource not found' })
    if (resource.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const schedule = await prisma.schedule.create({ data: { ...body.data, resourceId: id } })
    return reply.status(201).send(schedule)
  })

  // Protected: update existing schedule
  app.patch('/:id/schedules/:scheduleId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id, scheduleId } = request.params as { id: string; scheduleId: string }
    const body = scheduleSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.errors[0]?.message ?? 'Неверные данные' })

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { business: true },
    })
    if (!resource) return reply.status(404).send({ error: 'Resource not found' })
    if (resource.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } })
    if (!schedule || schedule.resourceId !== id) return reply.status(404).send({ error: 'Schedule not found' })

    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: body.data,
    })
    return reply.send(updated)
  })

  // Protected: delete schedule
  app.delete('/:id/schedules/:scheduleId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id, scheduleId } = request.params as { id: string; scheduleId: string }

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { business: true },
    })
    if (!resource) return reply.status(404).send({ error: 'Resource not found' })
    if (resource.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    await prisma.schedule.delete({ where: { id: scheduleId } })
    return reply.send({ ok: true })
  })

  // Public: get available slots for a resource
  app.get('/:id/slots', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { date, duration: durationParam } = request.query as { date: string; duration?: string }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return reply.status(400).send({ error: 'date query param required (YYYY-MM-DD)' })
    }
    const forceDuration = durationParam ? parseInt(durationParam, 10) : null

    const d = new Date(date)
    const dayOfWeek = d.getDay()

    const resource = await prisma.resource.findUnique({
      where: { id, isActive: true },
      include: {
        schedules: {
          where: { isActive: true, dayOfWeek: { has: dayOfWeek } },
          include: {
            exceptions: {
              where: {
                date: d,
              },
            },
          },
        },
      },
    })

    if (!resource) return reply.status(404).send({ error: 'Resource not found' })

    const slots: { start: string; end: string }[] = []
    for (const schedule of resource.schedules) {
      const exception = schedule.exceptions[0]
      if (exception?.isClosed) continue

      const start = exception?.startTime ?? schedule.startTime
      const end = exception?.endTime ?? schedule.endTime
      const duration = forceDuration ?? schedule.slotDurationMinutes

      const [startH, startM] = start.split(':').map(Number)
      const [endH, endM] = end.split(':').map(Number)
      let current = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      while (current + duration <= endMinutes) {
        const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
        const slotEnd = `${String(Math.floor((current + duration) / 60)).padStart(2, '0')}:${String((current + duration) % 60).padStart(2, '0')}`
        slots.push({ start: `${date}T${slotStart}`, end: `${date}T${slotEnd}` })
        current += duration
      }
    }

    // Filter out already booked slots
    const bookings = await prisma.booking.findMany({
      where: {
        resourceId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startAt: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(new Date(`${date}T00:00:00`).getTime() + 86_400_000),
        },
      },
      select: { startAt: true, endAt: true },
    })

    const now = new Date()
    const available = slots.filter((slot) => {
      const slotStart = new Date(slot.start)
      const slotEnd = new Date(slot.end)
      if (slotStart <= now) return false
      return !bookings.some(
        (b: { startAt: Date; endAt: Date }) => slotStart < b.endAt && slotEnd > b.startAt,
      )
    })

    return reply.send({ date, slots: available })
  })

  // GET /api/resources/:id/exceptions — list schedule exceptions for a resource (owner only)
  app.get('/:id/exceptions', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { business: true, schedules: { include: { exceptions: { orderBy: { date: 'asc' } } } } },
    })
    if (!resource) return reply.status(404).send({ error: 'Ресурс не найден' })
    if (resource.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Нет доступа' })

    const exceptions = resource.schedules.flatMap(s =>
      s.exceptions.map(e => ({ ...e, scheduleId: s.id, scheduleName: `${s.startTime}–${s.endTime}` }))
    )
    return reply.send(exceptions)
  })

  // POST /api/resources/:id/exceptions — add a day-off or custom hours (owner only)
  app.post('/:id/exceptions', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }

    const schema = z.object({
      date:      z.string().refine(d => !isNaN(Date.parse(d)), { message: 'Неверный формат даты' }),
      isClosed:  z.boolean().default(true),
      reason:    z.string().max(200).optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endTime:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
      // Which schedule to attach to; if omitted, uses first active schedule
      scheduleId: z.string().optional(),
    })

    const body = schema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.errors[0]?.message })

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { business: true, schedules: { where: { isActive: true }, orderBy: { createdAt: 'asc' }, take: 1 } },
    })
    if (!resource) return reply.status(404).send({ error: 'Ресурс не найден' })
    if (resource.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Нет доступа' })

    const scheduleId = body.data.scheduleId ?? resource.schedules[0]?.id
    if (!scheduleId) return reply.status(400).send({ error: 'У ресурса нет активного расписания' })

    // Upsert: replace existing exception for same date+schedule
    const dateObj = new Date(body.data.date)

    // Check if exception already exists for this date+schedule
    const existing = await prisma.scheduleException.findFirst({
      where: { scheduleId, date: dateObj },
    })

    let exception
    if (existing) {
      exception = await prisma.scheduleException.update({
        where: { id: existing.id },
        data: {
          isClosed:  body.data.isClosed,
          reason:    body.data.reason,
          startTime: body.data.isClosed ? null : body.data.startTime,
          endTime:   body.data.isClosed ? null : body.data.endTime,
        },
      })
    } else {
      exception = await prisma.scheduleException.create({
        data: {
          scheduleId,
          date:      dateObj,
          isClosed:  body.data.isClosed,
          reason:    body.data.reason,
          startTime: body.data.isClosed ? null : body.data.startTime,
          endTime:   body.data.isClosed ? null : body.data.endTime,
        },
      })
    }

    return reply.status(201).send(exception)
  })

  // DELETE /api/resources/:id/exceptions/:exceptionId — remove an exception (owner only)
  app.delete('/:id/exceptions/:exceptionId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id, exceptionId } = request.params as { id: string; exceptionId: string }

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { business: true },
    })
    if (!resource) return reply.status(404).send({ error: 'Ресурс не найден' })
    if (resource.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Нет доступа' })

    const exception = await prisma.scheduleException.findUnique({ where: { id: exceptionId } })
    if (!exception) return reply.status(404).send({ error: 'Исключение не найдено' })

    await prisma.scheduleException.delete({ where: { id: exceptionId } })
    return reply.send({ ok: true })
  })
}
