import crypto from 'crypto'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from './prisma'

const isProd = process.env.NODE_ENV === 'production'

export const ACCESS_TOKEN_COOKIE = 'access_token'
export const REFRESH_TOKEN_COOKIE = 'refresh_token'
const ACCESS_TOKEN_TTL = '30m'
const REFRESH_TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000 // ~1 year, sliding

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

function accessCookieOptions() {
  return { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/' }
}

function refreshCookieOptions() {
  return { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/api/auth', maxAge: Math.floor(REFRESH_TOKEN_TTL_MS / 1000) }
}

/** Signs an access token and sets both session cookies for a freshly-authenticated user. */
export async function issueSession(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  userId: string,
  role: string,
): Promise<void> {
  const accessToken = app.jwt.sign({ sub: userId, role }, { expiresIn: ACCESS_TOKEN_TTL })
  const refreshToken = crypto.randomBytes(32).toString('hex')

  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashToken(refreshToken),
      userAgent: request.headers['user-agent'] ?? null,
      ip: request.ip,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })

  reply.setCookie(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions())
  reply.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions())
}

/** Rotates the refresh token and issues a new access token. Returns false if the refresh token is missing/invalid. */
export async function rotateSession(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const refreshToken = (request.cookies as Record<string, string | undefined>)[REFRESH_TOKEN_COOKIE]
  if (!refreshToken) return false

  const session = await prisma.session.findUnique({ where: { refreshTokenHash: hashToken(refreshToken) } })
  if (!session || session.revokedAt || session.expiresAt < new Date()) return false

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return false

  const newRefreshToken = crypto.randomBytes(32).toString('hex')
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashToken(newRefreshToken),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })

  const accessToken = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: ACCESS_TOKEN_TTL })
  reply.setCookie(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions())
  reply.setCookie(REFRESH_TOKEN_COOKIE, newRefreshToken, refreshCookieOptions())
  return true
}

/** Revokes the current session (logout) and clears cookies. */
export async function revokeSession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const refreshToken = (request.cookies as Record<string, string | undefined>)[REFRESH_TOKEN_COOKIE]
  if (refreshToken) {
    await prisma.session.updateMany({
      where: { refreshTokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
  reply.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' })
  reply.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' })
}
