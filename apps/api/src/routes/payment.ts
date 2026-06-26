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

    if (!booking.business.bakaiUsername || !booking.business.bakaiPassword) {
      return reply.status(400).send({ error: 'Онлайн-оплата не настроена для этого бизнеса' })
    }

    const credentials = {
      username: booking.business.bakaiUsername,
      password: booking.business.bakaiPassword,
      businessId: booking.business.id,
    }

    const transactionId = `BK-${booking.id.slice(0, 12).toUpperCase()}-${Date.now()}`
    const redirectUrl = `${process.env.FRONTEND_URL}/booking/payment-result?bookingId=${booking.id}&txId=${transactionId}`

    const { payUrl } = await createPayLink({ amount, transactionId, redirectUrl, bookingId: booking.id, credentials })

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

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: { include: { business: true } } },
    })
    if (!payment) return reply.redirect(`${process.env.FRONTEND_URL}/booking/failed?bookingId=${bookingId}`)

    // Security: verify txId matches stored value — prevents spoofed callbacks
    if (payment.transactionId !== txId) {
      app.log.warn(`Payment txId mismatch for booking ${bookingId}`)
      return reply.redirect(`${process.env.FRONTEND_URL}/booking/failed?bookingId=${bookingId}`)
    }

    const biz = payment.booking.business
    const credentials = biz.bakaiUsername && biz.bakaiPassword
      ? { username: biz.bakaiUsername, password: biz.bakaiPassword, businessId: biz.id }
      : undefined

    const status = await getPaymentStatus(txId, credentials)

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

  // Bakai webhook — called by Bakai when payment succeeds
  // URL: POST /api/payments/webhook
  // Configure in Bakai Business portal → "Платежные ссылки" → "Вебхук"
  app.post('/webhook', async (request, reply) => {
    const body = request.body as { transactionId?: string; status?: string; amount?: number }
    app.log.info({ body }, 'Bakai webhook received')

    if (!body.transactionId) return reply.status(400).send({ error: 'transactionId required' })

    const payment = await prisma.payment.findFirst({
      where: { transactionId: body.transactionId },
      include: {
        booking: {
          include: {
            customer: { select: { email: true, name: true, phone: true } },
            resource: { select: { name: true } },
            service: { select: { name: true } },
            business: true,
          },
        },
      },
    })

    if (!payment) {
      app.log.warn({ transactionId: body.transactionId }, 'Webhook: payment not found')
      return reply.status(404).send({ error: 'Payment not found' })
    }

    if (payment.status === 'PAID') return reply.send({ ok: true, already: true })

    const isSuccess = !body.status || body.status === 'Success' || body.status === 'Processed'
    if (!isSuccess) return reply.send({ ok: true, ignored: true })

    const { booking } = payment
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID', paidAt: new Date() } }),
      prisma.booking.update({ where: { id: booking.id }, data: { status: 'CONFIRMED' } }),
    ])

    if (booking.customer) {
      sendBookingConfirmation(booking, booking.business, booking.customer.email).catch(console.error)
      prisma.user.findUnique({ where: { id: booking.business.ownerId }, select: { email: true } })
        .then(o => { if (o) sendNewBookingAlert(booking, o.email).catch(console.error) })
        .catch(console.error)
    }

    return reply.send({ ok: true })
  })
}
