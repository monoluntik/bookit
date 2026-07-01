import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { checkRateLimit } from '../index'
import { normalizePhone } from '../lib/phone'
import { hashToken, generateCode, issueSession, rotateSession, revokeSession } from '../lib/session'
import { sendSmsCode } from '../lib/sms'
import { sendTelegramMessage, buildAuthDeepLink } from '../lib/telegram'
import { isTestPhone, TEST_CODE } from '../lib/testPhones'

const CHALLENGE_TTL_MS = 10 * 60 * 1000
const SEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

const startSchema = z.object({
  phone: z.string().min(1, 'Телефон обязателен'),
})

const sendSchema = z.object({
  channel: z.enum(['TELEGRAM', 'SMS']),
})

const verifySchema = z.object({
  code: z.string().optional(),
})

function publicUser(user: { id: string; name: string; phone: string | null; email: string | null; role: string }) {
  return { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }
}

export async function authRoutes(app: FastifyInstance) {
  // POST /start — collect phone, create a pending challenge (name defaults to the existing user's name, or empty for new signups — collected later in the booking form)
  app.post('/start', async (request, reply) => {
    const ip = request.ip
    if (!checkRateLimit(ip, 20, 60_000)) {
      return reply.status(429).send({ error: 'Слишком много попыток. Подождите минуту.' })
    }

    const body = startSchema.safeParse(request.body)
    if (!body.success) {
      const msg = Object.values(body.error.flatten().fieldErrors).flat()[0] ?? 'Неверные данные'
      return reply.status(400).send({ error: msg })
    }

    const phone = normalizePhone(body.data.phone)
    if (!phone) return reply.status(400).send({ error: 'Неверный номер телефона' })

    if (!checkRateLimit(`start:${phone}`, 10, 10 * 60_000)) {
      return reply.status(429).send({ error: 'Слишком много попыток. Подождите немного.' })
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } })
    const code = generateCode()
    const telegramToken = crypto.randomBytes(16).toString('hex')

    const challenge = await prisma.authChallenge.create({
      data: {
        phone,
        name: existingUser?.name ?? '',
        channel: 'TELEGRAM',
        codeHash: hashToken(code),
        telegramToken,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      },
    })

    const canPushTelegram = !!existingUser?.telegramChatId
    if (canPushTelegram) {
      await sendTelegramPushCode(existingUser!.telegramChatId!, challenge.id, code)
      await prisma.authChallenge.update({ where: { id: challenge.id }, data: { lastSentAt: new Date() } })
    }

    return reply.status(201).send({
      challengeId: challenge.id,
      telegramDeepLink: buildAuthDeepLink(telegramToken),
      canPushTelegram,
    })
  })

  // POST /challenge/:id/send — (re)send the code via the chosen channel
  app.post('/challenge/:id/send', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = sendSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Неверные данные' })

    const challenge = await prisma.authChallenge.findUnique({ where: { id } })
    if (!challenge) return reply.status(404).send({ error: 'Сессия входа не найдена' })
    if (challenge.status !== 'PENDING' || challenge.expiresAt < new Date()) {
      return reply.status(410).send({ error: 'Сессия входа устарела, начните заново' })
    }
    if (challenge.lastSentAt && Date.now() - challenge.lastSentAt.getTime() < SEND_COOLDOWN_MS) {
      return reply.status(429).send({ error: 'Подождите перед повторной отправкой' })
    }

    if (body.data.channel === 'SMS') {
      if (!checkRateLimit(`sms:${challenge.phone}`, 5, 60 * 60_000)) {
        return reply.status(429).send({ error: 'Слишком много запросов SMS. Попробуйте позже.' })
      }
      const code = generateCode()
      await prisma.authChallenge.update({
        where: { id },
        data: { channel: 'SMS', codeHash: hashToken(code), lastSentAt: new Date() },
      })
      await sendSmsCode(challenge.phone, code)
      return reply.send({ ok: true })
    }

    // TELEGRAM — only meaningful (proactive push) when the phone is already linked
    const user = await prisma.user.findUnique({ where: { phone: challenge.phone } })
    if (user?.telegramChatId) {
      const code = generateCode()
      await prisma.authChallenge.update({
        where: { id },
        data: { channel: 'TELEGRAM', codeHash: hashToken(code), lastSentAt: new Date() },
      })
      await sendTelegramPushCode(user.telegramChatId, challenge.id, code)
    }
    return reply.send({ ok: true })
  })

  // GET /challenge/:id/status — poll target for the deep-link auto-confirm flow
  app.get('/challenge/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string }
    const challenge = await prisma.authChallenge.findUnique({ where: { id }, select: { status: true, expiresAt: true } })
    if (!challenge) return reply.status(404).send({ error: 'Сессия входа не найдена' })
    if (challenge.status === 'PENDING' && challenge.expiresAt < new Date()) {
      return reply.send({ status: 'EXPIRED' })
    }
    return reply.send({ status: challenge.status })
  })

  // POST /challenge/:id/verify — confirm via typed code, or finalize an already-confirmed (Telegram) challenge
  app.post('/challenge/:id/verify', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = verifySchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Неверные данные' })

    const challenge = await prisma.authChallenge.findUnique({ where: { id } })
    if (!challenge) return reply.status(404).send({ error: 'Сессия входа не найдена' })
    if (challenge.expiresAt < new Date() && challenge.status !== 'CONFIRMED') {
      return reply.status(410).send({ error: 'Сессия входа устарела, начните заново' })
    }

    if (challenge.status === 'PENDING') {
      if (challenge.attempts >= MAX_ATTEMPTS) {
        await prisma.authChallenge.update({ where: { id }, data: { status: 'EXPIRED' } })
        return reply.status(429).send({ error: 'Слишком много попыток, начните заново' })
      }
      const isValidTestCode = isTestPhone(challenge.phone) && body.data.code === TEST_CODE
      if (!isValidTestCode && (!body.data.code || !challenge.codeHash || hashToken(body.data.code) !== challenge.codeHash)) {
        await prisma.authChallenge.update({ where: { id }, data: { attempts: { increment: 1 } } })
        return reply.status(401).send({ error: 'Неверный код' })
      }
    }

    let user = challenge.userId
      ? await prisma.user.findUnique({ where: { id: challenge.userId } })
      : await prisma.user.findUnique({ where: { phone: challenge.phone } })

    if (!user) {
      user = await prisma.user.create({
        data: { name: challenge.name, phone: challenge.phone, role: 'CUSTOMER' },
      })
    }

    if (challenge.status !== 'CONFIRMED') {
      await prisma.authChallenge.update({ where: { id }, data: { status: 'CONFIRMED', userId: user.id } })
    }

    await issueSession(app, request, reply, user.id, user.role)
    return reply.send({ user: publicUser(user) })
  })

  // POST /refresh — silently renew the access token from the refresh cookie
  app.post('/refresh', async (request, reply) => {
    const ok = await rotateSession(app, request, reply)
    if (!ok) return reply.status(401).send({ error: 'Сессия истекла, войдите заново' })
    return reply.send({ ok: true })
  })

  // POST /logout
  app.post('/logout', async (request, reply) => {
    await revokeSession(request, reply)
    return reply.send({ ok: true })
  })

  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    return reply.send(user)
  })

  app.patch('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const body = z.object({ name: z.string().min(1).optional() }).safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Неверные данные' })

    const updated = await prisma.user.update({
      where: { id: payload.sub },
      data: { ...(body.data.name ? { name: body.data.name } : {}) },
      select: { id: true, email: true, name: true, phone: true, role: true },
    })
    return reply.send(updated)
  })
}

async function sendTelegramPushCode(chatId: string, challengeId: string, code: string) {
  await sendTelegramMessage(chatId, `Код для входа: <b>${code}</b>\nИли нажмите кнопку ниже, чтобы подтвердить вход.`, {
    inline_keyboard: [[{ text: '✅ Подтвердить вход', callback_data: `authconfirm:${challengeId}` }]],
  })
}
