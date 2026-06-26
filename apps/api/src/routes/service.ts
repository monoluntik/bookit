import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const createSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  price: z.number().nonnegative(),
  resourceId: z.string().optional(),
})

const updateSchema = createSchema.partial().omit({ businessId: true })

export async function serviceRoutes(app: FastifyInstance) {
  // GET services for a business (public)
  app.get('/business/:businessId', async (request, reply) => {
    const { businessId } = request.params as { businessId: string }
    const services = await prisma.service.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    })
    return reply.send(services)
  })

  // POST create service (owner only)
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const body = createSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.errors[0]?.message ?? 'Неверные данные' })

    const business = await prisma.business.findUnique({ where: { id: body.data.businessId } })
    if (!business) return reply.status(404).send({ error: 'Business not found' })
    if (business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    // Validate resourceId belongs to same business
    if (body.data.resourceId) {
      const resource = await prisma.resource.findUnique({ where: { id: body.data.resourceId } })
      if (!resource || resource.businessId !== body.data.businessId) {
        return reply.status(400).send({ error: 'Ресурс не найден или принадлежит другому бизнесу' })
      }
    }

    const service = await prisma.service.create({
      data: {
        businessId:     body.data.businessId,
        name:           body.data.name,
        description:    body.data.description,
        durationMinutes: body.data.durationMinutes,
        price:          body.data.price,
        resourceId:     body.data.resourceId,
      },
    })
    return reply.status(201).send(service)
  })

  // PATCH update service
  app.patch('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const body = updateSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.errors[0]?.message ?? 'Неверные данные' })

    const service = await prisma.service.findUnique({ where: { id }, include: { business: true } })
    if (!service) return reply.status(404).send({ error: 'Not found' })
    if (service.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const updated = await prisma.service.update({
      where: { id },
      data: body.data as any,
    })
    return reply.send(updated)
  })

  // DELETE service
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }

    const service = await prisma.service.findUnique({ where: { id }, include: { business: true } })
    if (!service) return reply.status(404).send({ error: 'Not found' })
    if (service.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    await prisma.service.delete({ where: { id } })
    return reply.send({ ok: true })
  })
}
