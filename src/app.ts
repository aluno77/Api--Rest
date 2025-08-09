import cookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastify from 'fastify'
import { transactionsRoutes } from './routes/transactions.ts'

export const app = fastify()

// Cookie
app.register(cookie)

// CORS
app.register(fastifyCors, {
  origin: 'http://localhost:5173',
})

// Register routes
app.register(transactionsRoutes, { prefix: 'transactions' })
