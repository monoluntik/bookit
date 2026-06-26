import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { BusinessTypeValues } from '../types/enums'

const createBusinessSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  type: z.enum(BusinessTypeValues),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

const updateBusinessSchema = createBusinessSchema.partial().omit({ slug: true })

export async function businessRoutes(app: FastifyInstance) {
  // Public: get business by slug
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const business = await prisma.business.findUnique({
      where: { slug, isActive: true },
      include: {
        resources: {
          where: { isActive: true },
          include: { schedules: { where: { isActive: true } }, services: { where: { isActive: true } } },
        },
        cancellationPolicy: true,
      },
    })
    if (!business) return reply.status(404).send({ error: 'Business not found' })
    return reply.send(business)
  })

  // Protected: get my businesses — registered BEFORE /:slug to avoid conflict
  app.get('/my', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const businesses = await prisma.business.findMany({
      where: { ownerId: payload.sub },
      select: { id: true, slug: true, name: true, type: true, isActive: true, subscriptionPlan: true },
    })
    return reply.send(businesses)
  })

  // Public: list all active businesses (marketplace)
  app.get('/', async (request, reply) => {
    const query = request.query as {
      type?: string; page?: string; limit?: string; query?: string
      minRating?: string; hasPhoto?: string; onlineOnly?: string; sort?: string
    }
    const page = Math.max(1, Number(query.page ?? 1))
    const limit = Math.min(50, Number(query.limit ?? 20))

    const where: any = {
      isActive: true,
      ...(query.type ? { type: query.type as (typeof BusinessTypeValues)[number] } : {}),
      ...(query.query ? {
        OR: [
          { name: { contains: query.query, mode: 'insensitive' } },
          { description: { contains: query.query, mode: 'insensitive' } },
          { address: { contains: query.query, mode: 'insensitive' } },
        ],
      } : {}),
      ...(query.hasPhoto === 'true' ? { logoUrl: { not: null } } : {}),
      ...(query.onlineOnly === 'true' ? {
        resources: { some: { isActive: true, schedules: { some: { isActive: true } } } },
      } : {}),
    }

    // Pre-filter by minimum rating via groupBy having
    if (query.minRating) {
      const minRating = parseFloat(query.minRating)
      if (!isNaN(minRating) && minRating > 0) {
        const qualifiedRows = await prisma.review.groupBy({
          by: ['businessId'],
          having: { rating: { _avg: { gte: minRating } } },
          _avg: { rating: true },
        })
        const qualifiedIds = qualifiedRows.map(r => r.businessId)
        // Intersect with any existing id filter
        where.id = where.id
          ? { in: (where.id.in as string[]).filter((id: string) => qualifiedIds.includes(id)) }
          : { in: qualifiedIds }
      }
    }

    const sort = query.sort ?? 'newest'

    // For sort=rating: get globally sorted IDs first, then paginate on them
    let paginatedWhere = where
    if (sort === 'rating') {
      const allIds = (await prisma.business.findMany({ where, select: { id: true } })).map(b => b.id)
      const ratingsData = allIds.length
        ? await prisma.review.groupBy({
            by: ['businessId'],
            where: { businessId: { in: allIds } },
            _avg: { rating: true },
            orderBy: { _avg: { rating: 'desc' } },
          })
        : []
      const ratedIds = ratingsData.map(r => r.businessId)
      const unratedIds = allIds.filter(id => !ratedIds.includes(id))
      const sortedIds = [...ratedIds, ...unratedIds]
      const pageIds = sortedIds.slice((page - 1) * limit, page * limit)
      paginatedWhere = { ...where, id: { in: pageIds } }
    }

    const orderBy: any =
      sort === 'az'     ? { name: 'asc' }   :
      sort === 'za'     ? { name: 'desc' }   :
      /* newest/rating */ { createdAt: 'desc' }

    const [businessRows, total] = await Promise.all([
      prisma.business.findMany({
        where: paginatedWhere,
        skip: sort === 'rating' ? 0 : (page - 1) * limit,
        take: limit,
        select: {
          id: true, slug: true, name: true, type: true,
          description: true, logoUrl: true, address: true,
          _count: { select: { reviews: true } },
        },
        orderBy,
      }),
      prisma.business.count({ where }),
    ])

    // Compute avgRating per business
    const bizIds = businessRows.map(b => b.id)
    const ratings = bizIds.length
      ? await prisma.review.groupBy({
          by: ['businessId'],
          where: { businessId: { in: bizIds } },
          _avg: { rating: true },
        })
      : []
    const ratingMap = Object.fromEntries(ratings.map(r => [r.businessId, r._avg.rating ?? 0]))

    let businesses = businessRows.map(b => ({
      id: b.id, slug: b.slug, name: b.name, type: b.type,
      description: b.description, logoUrl: b.logoUrl, address: b.address,
      reviewCount: b._count.reviews,
      avgRating: ratingMap[b.id] ?? 0,
    }))

    const totalPages = Math.ceil(total / limit)
    return reply.send({ businesses, total, page, limit, totalPages })
  })

  // Protected: create business
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const body = createBusinessSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.errors[0]?.message ?? 'Неверные данные' })

    const existing = await prisma.business.findUnique({ where: { slug: body.data.slug } })
    if (existing) return reply.status(409).send({ error: 'Slug already taken' })

    const { metadata, ...rest } = body.data
    const [business] = await prisma.$transaction([
      prisma.business.create({
        data: { ...rest, ownerId: payload.sub, ...(metadata ? { metadata: metadata as any } : {}) },
      }),
      prisma.user.update({
        where: { id: payload.sub },
        data: { role: 'BUSINESS_OWNER' },
      }),
    ])
    return reply.status(201).send(business)
  })

  // Protected: get/upsert cancellation policy
  app.get('/:id/cancellation-policy', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const business = await prisma.business.findUnique({ where: { id }, include: { cancellationPolicy: true } })
    if (!business) return reply.status(404).send({ error: 'Not found' })
    if (business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })
    return reply.send(business.cancellationPolicy ?? null)
  })

  app.put('/:id/cancellation-policy', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const bodySchema = z.object({
      freeCancellationHours: z.number().int().min(0).max(720),
      penaltyPercent: z.number().min(0).max(100),
      noRefundHours: z.number().int().min(0).max(720),
    })
    const body = bodySchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Неверные данные' })

    const business = await prisma.business.findUnique({ where: { id } })
    if (!business) return reply.status(404).send({ error: 'Not found' })
    if (business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const policy = await prisma.cancellationPolicy.upsert({
      where: { businessId: id },
      create: { businessId: id, ...body.data },
      update: body.data,
    })
    return reply.send(policy)
  })

  // Protected: update business images (logo + gallery)
  app.patch('/:id/images', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const body = request.body as { logoUrl?: string | null; images?: string[] }

    const business = await prisma.business.findUnique({ where: { id } })
    if (!business) return reply.status(404).send({ error: 'Not found' })
    if (business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const updated = await prisma.business.update({
      where: { id },
      data: {
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
        ...(body.images !== undefined ? { images: body.images } : {}),
      },
    })
    return reply.send(updated)
  })

  // Protected: update business
  app.patch('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { id } = request.params as { id: string }
    const body = updateBusinessSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.errors[0]?.message ?? 'Неверные данные' })

    const business = await prisma.business.findUnique({ where: { id } })
    if (!business) return reply.status(404).send({ error: 'Not found' })
    if (business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const { metadata: md, ...restData } = body.data
    const updated = await prisma.business.update({
      where: { id },
      data: { ...restData, ...(md ? { metadata: md as any } : {}) },
    })
    return reply.send(updated)
  })
}
