import type { FastifyInstance } from 'fastify'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { sendTelegramMessage, buildLinkUrl, getBotUsername, answerCallbackQuery } from '../lib/telegram'
import { generateCode, hashToken } from '../lib/session'

export async function telegramRoutes(app: FastifyInstance) {
  // Protected: current link status
  app.get('/status', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { telegramChatId: true },
    })
    return reply.send({ linked: !!user?.telegramChatId, botUsername: getBotUsername() })
  })

  // Protected: generate a one-time link token + deep link
  app.post('/link', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const token = crypto.randomBytes(16).toString('hex')

    await prisma.user.update({
      where: { id: payload.sub },
      data: { telegramLinkToken: token },
    })

    const url = buildLinkUrl(token)
    if (!url) return reply.status(503).send({ error: 'Telegram-бот не настроен' })
    return reply.send({ url, token })
  })

  // Protected: unlink
  app.delete('/link', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    await prisma.user.update({
      where: { id: payload.sub },
      data: { telegramChatId: null },
    })
    return reply.send({ ok: true })
  })

  // Public: Telegram webhook — receives /start <token> (linking or auth) and button taps
  app.post('/webhook', async (request, reply) => {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (secret && request.headers['x-telegram-bot-api-secret-token'] !== secret) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const body = request.body as {
      message?: { text?: string; chat?: { id: number } }
      callback_query?: { id: string; data?: string; message?: { chat?: { id: number } } }
    }

    if (body.callback_query) {
      await handleAuthCallback(body.callback_query)
      return reply.send({ ok: true })
    }

    const text = body.message?.text ?? ''
    const chatId = body.message?.chat?.id
    if (!chatId) return reply.send({ ok: true })

    const authMatch = text.match(/^\/start\s+auth_([a-f0-9]{32})$/)
    if (authMatch) {
      await handleAuthStart(String(chatId), authMatch[1])
      return reply.send({ ok: true })
    }

    const linkMatch = text.match(/^\/start\s+([a-f0-9]{32})$/)
    if (!linkMatch) {
      await sendTelegramMessage(String(chatId), 'Привет! Чтобы привязать аккаунт, перейдите по ссылке из личного кабинета на сайте.')
      return reply.send({ ok: true })
    }

    const token = linkMatch[1]
    const user = await prisma.user.findUnique({ where: { telegramLinkToken: token } })
    if (!user) {
      await sendTelegramMessage(String(chatId), 'Ссылка для привязки недействительна или устарела. Сгенерируйте новую в личном кабинете.')
      return reply.send({ ok: true })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { telegramChatId: String(chatId), telegramLinkToken: null },
    })

    await sendTelegramMessage(String(chatId), `✅ Готово, ${user.name}! Теперь вы будете получать напоминания о бронях здесь.`)
    return reply.send({ ok: true })
  })
}

// Deep-link auth: /start auth_<telegramToken> — confirm the challenge and reply with a fallback code
async function handleAuthStart(chatId: string, telegramToken: string) {
  const challenge = await prisma.authChallenge.findUnique({ where: { telegramToken } })
  if (!challenge || challenge.status !== 'PENDING' || challenge.expiresAt < new Date()) {
    await sendTelegramMessage(chatId, 'Ссылка для входа недействительна или устарела. Вернитесь на сайт и попробуйте снова.')
    return
  }

  let user = await prisma.user.findUnique({ where: { phone: challenge.phone } })
  if (!user) {
    user = await prisma.user.create({ data: { name: challenge.name, phone: challenge.phone, role: 'CUSTOMER' } })
  }
  if (!user.telegramChatId) {
    await prisma.user.update({ where: { id: user.id }, data: { telegramChatId: chatId } })
  }

  const fallbackCode = generateCode()
  await prisma.authChallenge.update({
    where: { id: challenge.id },
    data: { status: 'CONFIRMED', userId: user.id, codeHash: hashToken(fallbackCode) },
  })

  await sendTelegramMessage(
    chatId,
    `✅ Вход подтверждён, ${user.name}! Вернитесь на сайт — он подтвердит вход автоматически.\nЕсли этого не произошло, введите код на сайте: <b>${fallbackCode}</b>`,
  )
}

// Inline "Подтвердить вход" button tap for the proactive push (returning, already-linked user)
async function handleAuthCallback(callbackQuery: { id: string; data?: string; message?: { chat?: { id: number } } }) {
  const match = callbackQuery.data?.match(/^authconfirm:(.+)$/)
  const chatId = callbackQuery.message?.chat?.id
  if (!match || !chatId) {
    await answerCallbackQuery(callbackQuery.id)
    return
  }

  const challenge = await prisma.authChallenge.findUnique({ where: { id: match[1] } })
  if (!challenge || challenge.status !== 'PENDING' || challenge.expiresAt < new Date()) {
    await answerCallbackQuery(callbackQuery.id, 'Сессия входа устарела')
    return
  }

  const user = await prisma.user.findUnique({ where: { phone: challenge.phone } })
  if (!user) {
    await answerCallbackQuery(callbackQuery.id, 'Пользователь не найден')
    return
  }

  await prisma.authChallenge.update({ where: { id: challenge.id }, data: { status: 'CONFIRMED', userId: user.id } })
  await answerCallbackQuery(callbackQuery.id, 'Вход подтверждён ✅')
  await sendTelegramMessage(String(chatId), '✅ Вход подтверждён. Вернитесь на сайт.')
}
