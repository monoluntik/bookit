import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { createPayLink, getPaymentStatus } from '../lib/bakai'
import { sendBookingConfirmation, sendNewBookingAlert } from '../lib/email'

const initiateSchema = z.object({ bookingId: z.string() })

export async function paymentRoutes(app: FastifyInstance) {
  // Initiate payment — price calculated server-side from service
  app.post('/initiate', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const body = initiateSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'bookingId required' })

    const booking = await prisma.booking.findUnique({
      where: { id: body.data.bookingId },
      include: { business: true, service: { select: { price: true, name: true } }, payment: true },
    })

    if (!booking) return reply.status(404).send({ error: 'Booking not found' })
    if (booking.customerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })
    if (booking.payment?.status === 'PAID') return reply.status(409).send({ error: 'Already paid' })
    if (!booking.service) return reply.status(400).send({ error: 'Нет услуги для оплаты' })

    const amount = Number(booking.service.price)
    if (amount <= 0) return reply.status(400).send({ error: 'Услуга бесплатна' })

    const transactionId = `BK-${booking.id.slice(0, 12).toUpperCase()}-${Date.now()}`
    const redirectUrl = `${process.env.FRONTEND_URL}/booking/payment-result?bookingId=${booking.id}&txId=${transactionId}`

    const { payUrl } = await createPayLink({ amount, transactionId, redirectUrl, bookingId: booking.id })

    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      create: { bookingId: booking.id, amount, status: 'PENDING', transactionId },
      update: { amount, status: 'PENDING', transactionId },
    })

    return reply.send({ payUrl, transactionId, amount })
  })

  // Bakai redirect — verify txId matches stored transaction
  app.get('/result', async (request, reply) => {
    const { bookingId, txId } = request.query as { bookingId?: string; txId?: string }
    if (!bookingId || !txId) {
      return reply.redirect(`${process.env.FRONTEND_URL}/booking/failed?reason=missing-params`)
    }

    const payment = await prisma.payment.findUnique({ where: { bookingId } })
    if (!payment) return reply.redirect(`${process.env.FRONTEND_URL}/booking/failed?bookingId=${bookingId}`)

    // Security: verify txId matches stored value — prevents spoofed callbacks
    if (payment.transactionId !== txId) {
      app.log.warn(`Payment txId mismatch for booking ${bookingId}`)
      return reply.redirect(`${process.env.FRONTEND_URL}/booking/failed?bookingId=${bookingId}`)
    }

    const status = await getPaymentStatus(txId)

    if (status === 'SUCCESS') {
      await prisma.$transaction([
        prisma.payment.update({ where: { bookingId }, data: { status: 'PAID', paidAt: new Date() } }),
        prisma.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED' } }),
      ])

      const bk = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: { select: { email: true, name: true, phone: true } },
          resource: { select: { name: true } },
          service: { select: { name: true } },
          business: true,
        },
      })
      if (bk?.customer) {
        sendBookingConfirmation(bk, bk.business, bk.customer.email).catch(console.error)
        prisma.user.findUnique({ where: { id: bk.business.ownerId }, select: { email: true } })
          .then(o => { if (o) sendNewBookingAlert(bk, o.email).catch(console.error) })
          .catch(console.error)
      }
      return reply.redirect(`${process.env.FRONTEND_URL}/booking/success?bookingId=${bookingId}`)
    }

    if (status === 'FAILED') {
      await prisma.payment.update({ where: { bookingId }, data: { status: 'UNPAID' } })
      return reply.redirect(`${process.env.FRONTEND_URL}/booking/failed?bookingId=${bookingId}`)
    }

    return reply.redirect(`${process.env.FRONTEND_URL}/booking/payment-result?bookingId=${bookingId}&txId=${txId}`)
  })

  app.get('/status/:bookingId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const { bookingId } = request.params as { bookingId: string }
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: { include: { business: true } } },
    })
    if (!payment) return reply.status(404).send({ error: 'Payment not found' })

    const isCustomer = payment.booking.customerId === payload.sub
    const isOwner = payment.booking.business.ownerId === payload.sub
    if (!isCustomer && !isOwner) return reply.status(403).send({ error: 'Forbidden' })

    return reply.send({ status: payment.status, amount: Number(payment.amount), paidAt: payment.paidAt })
  })
}
