import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const MAX_RULES_PER_BUSINESS = 5

const createRuleSchema = z.object({
  businessId: z.string().min(1),
  offsetMinutes: z.number().int().positive(),
  label: z.string().min(1).max(40),
})

const updateRuleSchema = z.object({
  label: z.string().min(1).max(40).optional(),
  isActive: z.boolean().optional(),
})

async function assertOwner(businessId: string, userId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business) return { error: 'Business not found', status: 404 as const }
  if (business.ownerId !== userId) return { error: 'Forbidden', status: 403 as const }
  return null
}

export async function reminderRuleRoutes(app: FastifyInstance) {
  // Protected: list rules for a business
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { businessId } = request.query as { businessId?: string }
    if (!businessId) return reply.status(400).send({ error: 'businessId required' })

    const err = await assertOwner(businessId, payload.sub)
    if (err) return reply.status(err.status).send({ error: err.error })

    const rules = await prisma.reminderRule.findMany({
      where: { businessId },
      orderBy: { offsetMinutes: 'asc' },
    })
    return reply.send(rules)
  })

  // Protected: create rule (max 5 per business)
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const body = createRuleSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.errors[0]?.message ?? 'Неверные данные' })

    const err = await assertOwner(body.data.businessId, payload.sub)
    if (err) return reply.status(err.status).send({ error: err.error })

    const count = await prisma.reminderRule.count({ where: { businessId: body.data.businessId } })
    if (count >= MAX_RULES_PER_BUSINESS) {
      return reply.status(403).send({ error: `Максимум ${MAX_RULES_PER_BUSINESS} напоминаний на бизнес` })
    }

    try {
      const rule = await prisma.reminderRule.create({ data: body.data })
      return reply.status(201).send(rule)
    } catch (e: any) {
      if (e.code === 'P2002') return reply.status(409).send({ error: 'Такое напоминание уже существует' })
      throw e
    }
  })

  // Protected: update rule (toggle active / rename)
  app.patch('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const body = updateRuleSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Неверные данные' })

    const rule = await prisma.reminderRule.findUnique({ where: { id } })
    if (!rule) return reply.status(404).send({ error: 'Not found' })
    const err = await assertOwner(rule.businessId, payload.sub)
    if (err) return reply.status(err.status).send({ error: err.error })

    const updated = await prisma.reminderRule.update({ where: { id }, data: body.data })
    return reply.send(updated)
  })

  // Protected: delete rule
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }

    const rule = await prisma.reminderRule.findUnique({ where: { id } })
    if (!rule) return reply.status(404).send({ error: 'Not found' })
    const err = await assertOwner(rule.businessId, payload.sub)
    if (err) return reply.status(err.status).send({ error: err.error })

    await prisma.reminderRule.delete({ where: { id } })
    return reply.send({ ok: true })
  })
}
