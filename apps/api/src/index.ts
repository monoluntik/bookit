import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import { join } from 'path'
import authenticatePlugin from './plugins/authenticate'
import { authRoutes } from './routes/auth'
import { businessRoutes } from './routes/business'
import { resourceRoutes } from './routes/resource'
import { bookingRoutes } from './routes/booking'
import { paymentRoutes } from './routes/payment'
import { serviceRoutes } from './routes/service'
import { statsRoutes } from './routes/stats'
import { staffRoutes } from './routes/staff'
import { reviewRoutes } from './routes/review'
import { uploadRoutes } from './routes/upload'
import { adminRoutes } from './routes/admin'

const isProd = process.env.NODE_ENV === 'production'

if (isProd && !process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is required in production')
if (isProd && !process.env.FRONTEND_URL) throw new Error('FRONTEND_URL env var is required in production')

const app = Fastify({
  logger: isProd
    ? { level: 'warn' }
    : { level: 'info' },
})

// Simple in-memory rate limiter for login endpoint
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}
export { checkRateLimit }

const start = async () => {
  await app.register(multipart)
  await app.register(staticFiles, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  })

  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true,
  })

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    sign: { expiresIn: '7d' },
  })

  await app.register(authenticatePlugin)

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(businessRoutes, { prefix: '/api/businesses' })
  await app.register(resourceRoutes, { prefix: '/api/resources' })
  await app.register(bookingRoutes, { prefix: '/api/bookings' })
  await app.register(paymentRoutes, { prefix: '/api/payments' })
  await app.register(serviceRoutes, { prefix: '/api/services' })
  await app.register(statsRoutes, { prefix: '/api/stats' })
  await app.register(staffRoutes, { prefix: '/api/staff' })
  await app.register(reviewRoutes, { prefix: '/api/reviews' })
  await app.register(uploadRoutes, { prefix: '/api/upload' })
  await app.register(adminRoutes, { prefix: '/api/admin' })

  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  // Global error handler
  app.setErrorHandler((err: any, _req, reply) => {
    app.log.error(err)
    const status = err.statusCode ?? 500
    reply.status(status).send({ error: status < 500 ? err.message : 'Internal server error' })
  })

  const port = Number(process.env.PORT ?? 4000)
  await app.listen({ port, host: '0.0.0.0' })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
