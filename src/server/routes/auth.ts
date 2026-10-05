import { Router } from 'express'
import { ZodError } from 'zod'
import { AuthService } from '../auth/AuthService'
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth'

const auth = new AuthService()
export const authRouter = Router()

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
}

function sendError(res: import('express').Response, error: unknown, status = 400): void {
  if (error instanceof ZodError) {
    res.status(status).json({ error: error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }
  const message = error instanceof Error ? error.message : 'Error'
  res.status(status).json({ error: message })
}

authRouter.post('/register', async (req, res) => {
  try {
    const { user, token } = await auth.register(req.body)
    res.cookie('sid', token, cookieOpts)
    res.status(201).json({ user })
  } catch (error) {
    sendError(res, error, error instanceof Error && error.message.includes('existe') ? 409 : 400)
  }
})

authRouter.post('/login', async (req, res) => {
  try {
    const { user, token } = await auth.login(req.body)
    res.cookie('sid', token, cookieOpts)
    res.json({ user })
  } catch (error) {
    sendError(res, error, 401)
  }
})

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('sid', { path: '/' })
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await auth.me((req as AuthedRequest).userId)
    if (!user) {
      res.status(401).json({ error: 'No autenticado' })
      return
    }
    res.json({ user })
  } catch (error) {
    sendError(res, error, 500)
  }
})
