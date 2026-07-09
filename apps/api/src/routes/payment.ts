import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { createFinikPayment, decryptPrivateKey, verifyFinikWebhook } from '../lib/finik'
import { sendBookingConfirmation, sendNewBookingAlert } from '../lib/email'

const initiateSchema = z.object({ bookingId: z.string() })
const WEBHOOK_PATH = '/api/payments/webhook'

// No payment provider has been chosen/connected yet — /initiate fails honestly
// with a clear message instead of faking a successful payment. The Finik
// integration below is kept intact; flip this back on once a provider is picked.
const FINIK_ENABLED = false

async function markPaidAndNotify(app: FastifyInstance, bookingId: string) {
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
    if (bk.customer.email) sendBookingConfirmation(bk, bk.business, bk.customer.email).catch(console.error)
    prisma.user.findUnique({ where: { id: bk.business.ownerId }, select: { email: true } })
      .then(o => { if (o?.email) sendNewBookingAlert(bk, o.email).catch(console.error) })
      .catch(console.error)
  }
}

export async function paymentRoutes(app: FastifyInstance) {
  // Initiate payment — price calculated server-side from service/deposit
  app.post('/initiate', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const body = initiateSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'bookingId required' })

    const booking = await prisma.booking.findUnique({
      where: { id: body.data.bookingId },
      include: {
        business: true,
        service: { select: { price: true, name: true, depositAmount: true } },
        resource: { select: { depositAmount: true } },
        payment: true,
      },
    })

    if (!booking) return reply.status(404).send({ error: 'Booking not found' })
    if (booking.customerId !== payload.sub) return reply.status(403).send({ error: 'Forbidden' })
    if (booking.payment?.status === 'PAID') return reply.status(409).send({ error: 'Already paid' })

    const deposit = booking.service?.depositAmount ?? booking.resource.depositAmount
    const isDeposit = !!deposit && Number(deposit) > 0
    const totalAmount = booking.service ? Number(booking.service.price) : null
    const amount = isDeposit ? Number(deposit) : (totalAmount ?? 0)

    if (!isDeposit && !booking.service) return reply.status(400).send({ error: 'Нет услуги для оплаты' })
    if (amount <= 0) return reply.status(400).send({ error: 'Услуга бесплатна' })

    const { business } = booking

    if (!FINIK_ENABLED || !business.finikApiKey || !business.finikAccountId || !business.finikPrivateKeyEncrypted) {
      return reply.status(400).send({ error: 'Онлайн-оплата пока недоступна. Бизнес свяжется с вами для подтверждения брони.' })
    }

    const paymentId = crypto.randomUUID()
    const redirectUrl = `${process.env.FRONTEND_URL}/booking/payment-result?bookingId=${booking.id}`
    const webhookUrl = `${process.env.API_PUBLIC_URL ?? process.env.FRONTEND_URL}${WEBHOOK_PATH}`
    const result = await createFinikPayment({
      amount,
      paymentId,
      redirectUrl,
      webhookUrl,
      accountId: business.finikAccountId,
      nameEn: business.slug,
      apiKey: business.finikApiKey,
      privateKeyPem: decryptPrivateKey(business.finikPrivateKeyEncrypted),
    })
    const payUrl = result.payUrl

    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      create: { bookingId: booking.id, amount, isDeposit, totalAmount, status: 'PENDING', transactionId: paymentId },
      update: { amount, isDeposit, totalAmount, status: 'PENDING', transactionId: paymentId },
    })

    return reply.send({ payUrl, transactionId: paymentId, amount, isDeposit, totalAmount })
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

    return reply.send({
      status: payment.status,
      amount: Number(payment.amount),
      isDeposit: payment.isDeposit,
      totalAmount: payment.totalAmount ? Number(payment.totalAmount) : null,
      paidAt: payment.paidAt,
    })
  })

  // Finik webhook — the source of truth for payment confirmation (their
  // redirect alone is not reliable). Configure webhookUrl per-payment via the
  // Data.webhookUrl field sent in /initiate; Finik retries with backoff, so
  // this must be idempotent (guarded by payment.status === 'PAID' below).
  app.post('/webhook', async (request, reply) => {
    const signature = request.headers['signature'] as string | undefined
    const body = request.body as { id?: string; transactionId?: string; status?: string; fields?: { paymentId?: string } }
    app.log.info({ id: body.id, transactionId: body.transactionId, status: body.status, paymentId: body.fields?.paymentId }, 'Finik webhook received')

    if (!signature) return reply.status(400).send({ error: 'signature header required' })

    const isValid = await verifyFinikWebhook({
      body: body as Record<string, unknown>,
      headers: request.headers as Record<string, string | undefined>,
      httpMethod: 'POST',
      path: WEBHOOK_PATH,
    }, signature)
    if (!isValid) {
      app.log.warn('Finik webhook signature verification failed')
      return reply.status(401).send({ error: 'Invalid signature' })
    }

    const paymentId = body.fields?.paymentId ?? body.transactionId ?? body.id
    if (!paymentId) return reply.status(400).send({ error: 'paymentId required' })

    const payment = await prisma.payment.findFirst({ where: { transactionId: paymentId } })
    if (!payment) {
      app.log.warn({ paymentId }, 'Finik webhook: payment not found')
      return reply.status(404).send({ error: 'Payment not found' })
    }

    if (payment.status === 'PAID') return reply.send({ ok: true, already: true })
    if (body.status !== 'success') return reply.send({ ok: true, ignored: true })

    await markPaidAndNotify(app, payment.bookingId)
    return reply.send({ ok: true })
  })
}
