import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { localDayStart, localMonthStart, utcToLocalDateStr } from '../lib/datetime'

export async function statsRoutes(app: FastifyInstance) {
  app.get('/business/:businessId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { businessId } = request.params as { businessId: string }

    const business = await prisma.business.findUnique({ where: { id: businessId } })
    if (!business) return reply.status(404).send({ error: 'Not found' })
    if (business.ownerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })

    const now = new Date()
    const todayStart = localDayStart(business.timezone)
    const todayEnd = new Date(todayStart.getTime() + 86400000)
    const monthStart = localMonthStart(now, business.timezone)
    const prevMonthStart = localMonthStart(now, business.timezone, -1)
    const prevMonthEnd = monthStart

    const [
      todayCount, monthCount, totalCount, pendingCount,
      revenueMonth, prevRevenueMonth,
      prevMonthCount,
      upcomingBookings,
      allBookingsThisMonth,
      statusBreakdown,
    ] = await Promise.all([
      prisma.booking.count({ where: { businessId, startAt: { gte: todayStart, lt: todayEnd } } }),
      prisma.booking.count({ where: { businessId, startAt: { gte: monthStart } } }),
      prisma.booking.count({ where: { businessId } }),
      prisma.booking.count({ where: { businessId, status: 'PENDING' } }),
      prisma.payment.aggregate({
        where: { booking: { businessId }, status: 'PAID', paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { booking: { businessId }, status: 'PAID', paidAt: { gte: prevMonthStart, lt: prevMonthEnd } },
        _sum: { amount: true },
      }),
      prisma.booking.count({ where: { businessId, startAt: { gte: prevMonthStart, lt: prevMonthEnd } } }),
      prisma.booking.findMany({
        where: { businessId, startAt: { gte: now }, status: { in: ['PENDING', 'CONFIRMED'] } },
        include: {
          customer: { select: { name: true, phone: true } },
          resource: { select: { name: true } },
          service: { select: { name: true } },
        },
        orderBy: { startAt: 'asc' },
        take: 5,
      }),
      // Last 30 days daily bookings for chart
      prisma.booking.findMany({
        where: { businessId, startAt: { gte: monthStart } },
        select: { startAt: true, status: true },
        orderBy: { startAt: 'asc' },
      }),
      // Status breakdown
      prisma.booking.groupBy({
        by: ['status'],
        where: { businessId },
        _count: { status: true },
      }),
    ])

    // Build daily chart data (last 30 days), bucketed by the business's local day
    const dailyMap: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(monthStart.getTime() + i * 86400000)
      if (d > now) break
      const key = utcToLocalDateStr(d, business.timezone)
      dailyMap[key] = 0
    }
    allBookingsThisMonth.forEach(b => {
      const key = utcToLocalDateStr(b.startAt, business.timezone)
      if (key in dailyMap) dailyMap[key]++
    })
    const dailyChart = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

    const statusMap: Record<string, number> = {}
    statusBreakdown.forEach(s => { statusMap[s.status] = s._count.status })

    return reply.send({
      today: todayCount,
      month: monthCount,
      total: totalCount,
      pending: pendingCount,
      revenueMonth: Number(revenueMonth._sum.amount ?? 0),
      prevRevenueMonth: Number(prevRevenueMonth._sum.amount ?? 0),
      prevMonthCount,
      upcomingBookings,
      dailyChart,
      statusBreakdown: statusMap,
    })
  })
}
