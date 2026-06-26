import type { FastifyInstance } from 'fastify'
import { createWriteStream, mkdirSync } from 'fs'
import { join, extname, resolve, normalize } from 'path'
import { randomBytes } from 'crypto'
import { pipeline } from 'stream/promises'

const UPLOAD_DIR = join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

mkdirSync(UPLOAD_DIR, { recursive: true })

export async function uploadRoutes(app: FastifyInstance) {
  // POST /api/upload — upload a single image, returns { url }
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const data = await request.file({ limits: { fileSize: MAX_FILE_SIZE } })
    if (!data) return reply.status(400).send({ error: 'Файл не найден' })

    if (!ALLOWED_TYPES.has(data.mimetype)) {
      return reply.status(400).send({ error: 'Допустимые форматы: JPEG, PNG, WebP, GIF' })
    }

    const ext = extname(data.filename).toLowerCase() || '.jpg'
    const filename = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`
    const filepath = join(UPLOAD_DIR, filename)

    await pipeline(data.file, createWriteStream(filepath))

    // If file was too large, Fastify multipart truncates and sets truncated flag
    if (data.file.truncated) {
      const { unlink } = await import('fs/promises')
      await unlink(filepath).catch(() => {})
      return reply.status(413).send({ error: 'Файл слишком большой. Максимум 5 МБ.' })
    }

    const host = process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`
    return reply.status(201).send({ url: `${host}/uploads/${filename}` })
  })

  // DELETE /api/upload — delete an image by URL
  app.delete('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = request.body as { url?: string }
    if (!body?.url) return reply.status(400).send({ error: 'url required' })

    // Only allow deleting files from our uploads dir
    const rawFilename = body.url.split('/uploads/').pop()
    if (!rawFilename) return reply.status(400).send({ error: 'Недопустимый URL' })

    // Decode URL-encoding then resolve to canonical path to prevent traversal
    const filename = decodeURIComponent(rawFilename)
    const target = resolve(join(UPLOAD_DIR, filename))
    if (!target.startsWith(resolve(UPLOAD_DIR) + '/')) {
      return reply.status(400).send({ error: 'Недопустимый путь' })
    }

    const { unlink } = await import('fs/promises')
    await unlink(target).catch(() => {})
    return reply.send({ ok: true })
  })
}
