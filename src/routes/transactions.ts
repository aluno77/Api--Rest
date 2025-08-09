import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod/v4'
import { db } from '../database.ts'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists.ts'

// Unitários: unidade de uma aplicação
//Integração: comunicação entre duas ou mais unidades
// e2e: teste de ponta a ponta: simulam um usuário operando a aplicação

// Cookie <-> Formas de gente manter contexto entre requisições

export async function transactionsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async request => {
    const { sessionId } = request.cookies

    const transactions = await db('transactions')
      .where('session_id', sessionId)
      .select()

    return {
      transactions,
    }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async request => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionParamsSchema.parse(request.params)

    const { sessionId } = request.cookies

    const transaction = await db('transactions')
      .where({
        session_id: sessionId,
        id: id,
      })
      .first()

    return { transaction }
  })

  app.get('/summary', { preHandler: [checkSessionIdExists] }, async request => {
    const { sessionId } = request.cookies

    const summary = await db('transactions')
      .where('session_id', sessionId)
      .sum('amount', { as: 'amount' })
      .first()

    return { summary }
  })

  app.post('/', async (request, reply) => {
    const createTransactionSchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionSchema.parse(request.body)

    //TODO: Get the session ID from the cookies
    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
      //TODO: Set the session ID cookie
      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
      })
    }

    await db('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
