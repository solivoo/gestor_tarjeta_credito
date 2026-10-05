import type { NextFunction, Request, Response } from 'express'
import { AuthService } from '../auth/AuthService'

const auth = new AuthService()

export type AuthedRequest = Request & { userId: string }

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.sid as string | undefined
    if (!token) {
      res.status(401).json({ error: 'No autenticado' })
      return
    }
    const userId = auth.verify(token)
    ;(req as AuthedRequest).userId = userId
    next()
  } catch {
    res.status(401).json({ error: 'Sesión inválida o expirada' })
  }
}
