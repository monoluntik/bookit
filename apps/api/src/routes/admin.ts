import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

// All endpoints require SUPERADMIN role
async function requireSuperAdmin(request: any, reply: any) {
  const payload = request.user as { sub: string }
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { role: true } })
  if (user?.role !== 'SUPERADMIN') {
    return reply.status(403).send({ error: 'Доступ запрещён' })
  }
}

export async function adminRoutes(app: FastifyInstance) {
  // ── Global platform stats ──────────────────────────────────────────────────
  app.get('/stats', { preHandler: [app.authenticate] }, async (request, reply) => {
    await requireSuperAdmin(request, reply)
    if (reply.sent) return

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      totalUsers, newUsersMonth,
      totalBusinesses, activeBusinesses,
      totalBookings, bookingsMonth,
      totalRevenue, revenueMonth,
      totalReviews,
      usersByRole,
      businessesByType,
      recentBookings,
      dailyChart,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.business.count(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.review.count(),
      prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
      prisma.business.groupBy({ by: ['type'], _count: { type: true }, where: { isActive: true } }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          customer: { select: { name: true, email: true } },
          business: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),
      prisma.booking.findMany({
        where: { createdAt: { gte: prevMonthStart } },
        select: { createdAt: true },
      }),
    ])

    // Daily chart last 60 days
    const dailyMap: Record<string, number> = {}
    for (let i = 59; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      dailyMap[d.toISOString().slice(0, 10)] = 0
    }
    dailyChart.forEach(b => {
      const key = new Date(b.createdAt).toISOString().slice(0, 10)
      if (key in dailyMap) dailyMap[key]++
    })

    return reply.send({
      users: { total: totalUsers, newMonth: newUsersMonth, byRole: Object.fromEntries(usersByRole.map(r => [r.role, r._count.role])) },
      businesses: { total: totalBusinesses, active: activeBusinesses, byType: Object.fromEntries(businessesByType.map(t => [t.type, t._count.type])) },
      bookings: { total: totalBookings, month: bookingsMonth },
      revenue: { total: Number(totalRevenue._sum.amount ?? 0), month: Number(revenueMonth._sum.amount ?? 0) },
      reviews: { total: totalReviews },
      recentBookings,
      dailyChart: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
    })
  })

  // ── Users list ─────────────────────────────────────────────────────────────
  app.get('/users', { preHandler: [app.authenticate] }, async (request, reply) => {
    await requireSuperAdmin(request, reply)
    if (reply.sent) return

    const { page = '1', limit = '30', query: q, role } = request.query as Record<string, string>
    const p = Math.max(1, Number(page)), l = Math.min(100, Number(limit))

    const where: any = {
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {}),
      ...(role ? { role } : {}),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          isActive: true, createdAt: true,
          _count: { select: { bookings: true, ownedBusinesses: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l, take: l,
      }),
      prisma.user.count({ where }),
    ])

    return reply.send({ users, total, page: p, totalPages: Math.ceil(total / l) })
  })

  // ── Block / unblock user ───────────────────────────────────────────────────
  app.patch('/users/:id/status', { preHandler: [app.authenticate] }, async (request, reply) => {
    await requireSuperAdmin(request, reply)
    if (reply.sent) return

    const { id } = request.params as { id: string }
    const { isActive } = request.body as { isActive: boolean }

    const user = await prisma.user.update({ where: { id }, data: { isActive } })
    return reply.send({ id: user.id, isActive: user.isActive })
  })

  // ── Change user role ───────────────────────────────────────────────────────
  app.patch('/users/:id/role', { preHandler: [app.authenticate] }, async (request, reply) => {
    await requireSuperAdmin(request, reply)
    if (reply.sent) return

    const { id } = request.params as { id: string }
    const schema = z.object({ role: z.enum(['CUSTOMER', 'BUSINESS_OWNER', 'SUPERADMIN']) })
    const body = schema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid role' })

    const user = await prisma.user.update({ where: { id }, data: { role: body.data.role as any } })
    return reply.send({ id: user.id, role: user.role })
  })

  // ── Businesses list ────────────────────────────────────────────────────────
  app.get('/businesses', { preHandler: [app.authenticate] }, async (request, reply) => {
    await requireSuperAdmin(request, reply)
    if (reply.sent) return

    const { page = '1', limit = '30', query: q, type, isActive } = request.query as Record<string, string>
    const p = Math.max(1, Number(page)), l = Math.min(100, Number(limit))

    const where: any = {
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }] } : {}),
      ...(type ? { type } : {}),
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: {
          owner: { select: { name: true, email: true } },
          _count: { select: { bookings: true, reviews: true, resources: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l, take: l,
      }),
      prisma.business.count({ where }),
    ])

    return reply.send({ businesses, total, page: p, totalPages: Math.ceil(total / l) })
  })

  // ── Toggle business active ─────────────────────────────────────────────────
  app.patch('/businesses/:id/status', { preHandler: [app.authenticate] }, async (request, reply) => {
    await requireSuperAdmin(request, reply)
    if (reply.sent) return

    const { id } = request.params as { id: string }
    const { isActive } = request.body as { isActive: boolean }

    const biz = await prisma.business.update({ where: { id }, data: { isActive } })
    return reply.send({ id: biz.id, isActive: biz.isActive })
  })

  // ── Delete review (moderation) ─────────────────────────────────────────────
  app.delete('/reviews/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    await requireSuperAdmin(request, reply)
    if (reply.sent) return

    const { id } = request.params as { id: string }
    await prisma.review.delete({ where: { id } })
    return reply.send({ ok: true })
  })

  // ── Recent reviews (all businesses) ───────────────────────────────────────
  app.get('/reviews', { preHandler: [app.authenticate] }, async (request, reply) => {
    await requireSuperAdmin(request, reply)
    if (reply.sent) return

    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const p = Math.max(1, Number(page)), l = Math.min(50, Number(limit))

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        include: {
          customer: { select: { name: true, email: true } },
          business: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l, take: l,
      }),
      prisma.review.count(),
    ])

    return reply.send({ reviews, total, page: p, totalPages: Math.ceil(total / l) })
  })
}
