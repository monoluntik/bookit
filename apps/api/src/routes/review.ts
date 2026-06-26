import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

const replySchema = z.object({
  reply: z.string().max(500),
})

export async function reviewRoutes(app: FastifyInstance) {
  // POST / — customer submits a review for a completed booking
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const body = createReviewSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: body.error.errors[0]?.message ?? 'Неверные данные' })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: body.data.bookingId },
      include: { review: true },
    })
    if (!booking) return reply.status(404).send({ error: 'Бронь не найдена' })
    if (booking.customerId !== payload.sub) return reply.status(403).send({ error: 'Нет доступа' })
    if (booking.status !== 'COMPLETED') return reply.status(400).send({ error: 'Отзыв можно оставить только после завершённого визита' })
    if (booking.review) return reply.status(409).send({ error: 'Отзыв уже оставлен' })

    const review = await prisma.review.create({
      data: {
        rating: body.data.rating,
        comment: body.data.comment,
        customerId: payload.sub,
        businessId: booking.businessId,
        bookingId: body.data.bookingId,
      },
      include: { customer: { select: { name: true } } },
    })
    return reply.status(201).send(review)
  })

  // GET /business/:businessId — get all reviews for a business (public)
  app.get('/business/:businessId', async (request, reply) => {
    const { businessId } = request.params as { businessId: string }
    const query = request.query as { page?: string; limit?: string }
    const page = Math.max(1, Number(query.page ?? 1))
    const limit = Math.min(50, Number(query.limit ?? 10))

    const [reviews, total, avg] = await Promise.all([
      prisma.review.findMany({
        where: { businessId },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.review.count({ where: { businessId } }),
      prisma.review.aggregate({
        where: { businessId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ])

    return reply.send({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      avgRating: avg._avg.rating ? Math.round(avg._avg.rating * 10) / 10 : null,
      reviewCount: avg._count.rating,
    })
  })

  // PATCH /:id/reply — owner replies to a review
  app.patch('/:id/reply', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const body = replySchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Неверные данные' })

    const review = await prisma.review.findUnique({
      where: { id },
      include: { business: true },
    })
    if (!review) return reply.status(404).send({ error: 'Отзыв не найден' })
    if (review.business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Нет доступа' })

    const updated = await prisma.review.update({
      where: { id },
      data: { reply: body.data.reply },
      include: { customer: { select: { name: true } } },
    })
    return reply.send(updated)
  })

  // DELETE /:id — customer deletes own review
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) return reply.status(404).send({ error: 'Отзыв не найден' })
    if (review.customerId !== payload.sub) return reply.status(403).send({ error: 'Нет доступа' })

    await prisma.review.delete({ where: { id } })
    return reply.send({ ok: true })
  })
}
