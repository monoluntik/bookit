import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'

export default fp(async (app: FastifyInstance) => {
  app.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })
})
