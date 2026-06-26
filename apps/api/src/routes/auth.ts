import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { checkRateLimit } from '../index'
import { sendPasswordReset } from '../lib/email'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  name: z.string().min(1, 'Имя обязательно'),
  phone: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const ip = request.ip
    if (!checkRateLimit(ip, 20, 60_000)) {
      return reply.status(429).send({ error: 'Слишком много попыток. Подождите минуту.' })
    }

    const body = registerSchema.safeParse(request.body)
    if (!body.success) {
      const msg = Object.values(body.error.flatten().fieldErrors).flat()[0]
        ?? body.error.flatten().formErrors[0]
        ?? 'Неверные данные'
      return reply.status(400).send({ error: msg })
    }

    const existing = await prisma.user.findUnique({ where: { email: body.data.email } })
    if (existing) return reply.status(409).send({ error: 'Этот email уже зарегистрирован' })

    const passwordHash = await bcrypt.hash(body.data.password, 12)
    const user = await prisma.user.create({
      data: { email: body.data.email, passwordHash, name: body.data.name, phone: body.data.phone },
      select: { id: true, email: true, name: true, phone: true, role: true },
    })

    const token = app.jwt.sign({ sub: user.id, role: user.role })
    return reply.status(201).send({ user, token })
  })

  app.post('/login', async (request, reply) => {
    const ip = request.ip
    if (!checkRateLimit(ip, 10, 60_000)) {
      return reply.status(429).send({ error: 'Слишком много попыток. Подождите минуту.' })
    }

    const body = loginSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Неверные данные' })

    const user = await prisma.user.findUnique({ where: { email: body.data.email } })
    if (!user) return reply.status(401).send({ error: 'Неверный email или пароль' })

    const valid = await bcrypt.compare(body.data.password, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Неверный email или пароль' })

    const token = app.jwt.sign({ sub: user.id, role: user.role })
    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
      token,
    })
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

  // POST /forgot-password — send reset link via email
  app.post('/forgot-password', async (request, reply) => {
    const ip = request.ip
    if (!checkRateLimit(ip, 5, 60_000)) {
      return reply.status(429).send({ error: 'Слишком много попыток. Подождите минуту.' })
    }
    const body = z.object({ email: z.string().email() }).safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Неверный email' })

    const user = await prisma.user.findUnique({ where: { email: body.data.email } })
    // Always return success to prevent user enumeration
    if (!user) return reply.send({ ok: true })

    const resetToken = app.jwt.sign(
      { sub: user.id, purpose: 'reset' },
      { expiresIn: '15m' },
    )
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`
    await sendPasswordReset(user.email, resetUrl).catch(console.error)

    return reply.send({ ok: true })
  })

  // POST /reset-password — set new password using reset token
  app.post('/reset-password', async (request, reply) => {
    const body = z.object({
      token: z.string().min(1),
      password: z.string().min(6, 'Пароль минимум 6 символов'),
    }).safeParse(request.body)
    if (!body.success) {
      const msg = body.error.errors[0]?.message ?? 'Неверные данные'
      return reply.status(400).send({ error: msg })
    }

    let payload: { sub: string; purpose: string }
    try {
      payload = app.jwt.verify(body.data.token) as any
    } catch {
      return reply.status(400).send({ error: 'Ссылка устарела или недействительна' })
    }
    if (payload.purpose !== 'reset') {
      return reply.status(400).send({ error: 'Недействительный токен' })
    }

    const passwordHash = await bcrypt.hash(body.data.password, 12)
    await prisma.user.update({ where: { id: payload.sub }, data: { passwordHash } })

    return reply.send({ ok: true })
  })

  app.patch('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user as { sub: string }
    const body = updateProfileSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Неверные данные' })

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    if (body.data.newPassword) {
      if (!body.data.currentPassword) return reply.status(400).send({ error: 'Введите текущий пароль' })
      const valid = await bcrypt.compare(body.data.currentPassword, user.passwordHash)
      if (!valid) return reply.status(400).send({ error: 'Неверный текущий пароль' })
    }

    const updateData: any = {}
    if (body.data.name) updateData.name = body.data.name
    if (body.data.phone !== undefined) updateData.phone = body.data.phone || null
    if (body.data.newPassword) updateData.passwordHash = await bcrypt.hash(body.data.newPassword, 12)

    const updated = await prisma.user.update({
      where: { id: payload.sub },
      data: updateData,
      select: { id: true, email: true, name: true, phone: true, role: true },
    })
    return reply.send(updated)
  })
}
