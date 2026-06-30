import type { FastifyInstance } from 'fastify'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { sendTelegramMessage, buildLinkUrl, getBotUsername } from '../lib/telegram'

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

  // Public: Telegram webhook — receives /start <token> to complete linking
  app.post('/webhook', async (request, reply) => {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (secret && request.headers['x-telegram-bot-api-secret-token'] !== secret) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const body = request.body as {
      message?: { text?: string; chat?: { id: number } }
    }
    const text = body.message?.text ?? ''
    const chatId = body.message?.chat?.id

    if (!chatId) return reply.send({ ok: true })

    const match = text.match(/^\/start\s+([a-f0-9]{32})$/)
    if (!match) {
      await sendTelegramMessage(String(chatId), 'Привет! Чтобы привязать аккаунт, перейдите по ссылке из личного кабинета на сайте.')
      return reply.send({ ok: true })
    }

    const token = match[1]
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
