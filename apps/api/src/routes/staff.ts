import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { normalizePhone } from '../lib/phone'

const inviteSchema = z.object({
  businessId: z.string(),
  phone: z.string().min(1),
  roleId: z.string().optional(),
  position: z.string().optional(),
})

export async function staffRoutes(app: FastifyInstance) {
  // List staff for business
  app.get('/business/:businessId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { businessId } = request.params as { businessId: string }

    const business = await prisma.business.findUnique({ where: { id: businessId } })
    if (!business) return reply.status(404).send({ error: 'Not found' })
    if (business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const staff = await prisma.staffMember.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        role: { select: { id: true, name: true, permissions: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return reply.send(staff)
  })

  // Add staff member (user must already exist)
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const body = inviteSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.errors[0]?.message ?? 'Неверные данные' })

    const business = await prisma.business.findUnique({ where: { id: body.data.businessId } })
    if (!business) return reply.status(404).send({ error: 'Business not found' })
    if (business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const phone = normalizePhone(body.data.phone)
    if (!phone) return reply.status(400).send({ error: 'Неверный номер телефона' })

    if (body.data.roleId) {
      const role = await prisma.customRole.findUnique({ where: { id: body.data.roleId } })
      if (!role || role.businessId !== body.data.businessId) {
        return reply.status(400).send({ error: 'Роль не найдена в этом бизнесе' })
      }
    }

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) return reply.status(404).send({ error: 'Пользователь с таким телефоном не найден. Попросите его сначала войти на сайте.' })

    const existing = await prisma.staffMember.findFirst({
      where: { userId: user.id, businessId: body.data.businessId },
    })
    if (existing) return reply.status(409).send({ error: 'Этот пользователь уже является сотрудником' })

    const member = await prisma.staffMember.create({
      data: {
        userId: user.id,
        businessId: body.data.businessId,
        roleId: body.data.roleId ?? null,
        position: body.data.position,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        role: { select: { id: true, name: true } },
      },
    })
    return reply.status(201).send(member)
  })

  // Update position/role
  app.patch('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const body = z.object({ roleId: z.string().nullable().optional(), position: z.string().optional() }).safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.errors[0]?.message ?? 'Неверные данные' })

    const member = await prisma.staffMember.findUnique({ where: { id }, include: { business: true } })
    if (!member) return reply.status(404).send({ error: 'Not found' })
    if (member.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    if (body.data.roleId) {
      const role = await prisma.customRole.findUnique({ where: { id: body.data.roleId } })
      if (!role || role.businessId !== member.businessId) {
        return reply.status(400).send({ error: 'Роль не найдена в этом бизнесе' })
      }
    }

    const updated = await prisma.staffMember.update({
      where: { id },
      data: body.data as any,
      include: { user: { select: { name: true, email: true } }, role: { select: { name: true } } },
    })
    return reply.send(updated)
  })

  // Remove staff member
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }

    const member = await prisma.staffMember.findUnique({ where: { id }, include: { business: true } })
    if (!member) return reply.status(404).send({ error: 'Not found' })
    if (member.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    await prisma.staffMember.delete({ where: { id } })
    return reply.send({ ok: true })
  })
}
