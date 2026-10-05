import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { UserModel } from '../models'

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(1, 'El nombre es obligatorio'),
})

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type AuthUser = {
  id: string
  email: string
  name: string
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET es requerido')
  return secret
}

export class AuthService {
  async register(input: unknown): Promise<{ user: AuthUser; token: string }> {
    const parsed = registerSchema.parse(input)
    const email = parsed.email.trim().toLowerCase()
    const existing = await UserModel.findOne({ where: { email } })
    if (existing) throw new Error('Ya existe una cuenta con ese email')

    const passwordHash = await bcrypt.hash(parsed.password, 12)
    const row = await UserModel.create({
      id: uuid(),
      email,
      passwordHash,
      name: parsed.name.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const user = { id: row.id, email: row.email, name: row.name }
    return { user, token: this.sign(user.id) }
  }

  async login(input: unknown): Promise<{ user: AuthUser; token: string }> {
    const parsed = loginSchema.parse(input)
    const email = parsed.email.trim().toLowerCase()
    const row = await UserModel.findOne({ where: { email } })
    if (!row) throw new Error('Credenciales inválidas')

    const ok = await bcrypt.compare(parsed.password, row.passwordHash)
    if (!ok) throw new Error('Credenciales inválidas')

    const user = { id: row.id, email: row.email, name: row.name }
    return { user, token: this.sign(user.id) }
  }

  async me(userId: string): Promise<AuthUser | null> {
    const row = await UserModel.findByPk(userId)
    if (!row) return null
    return { id: row.id, email: row.email, name: row.name }
  }

  verify(token: string): string {
    const payload = jwt.verify(token, jwtSecret()) as { sub: string }
    if (!payload.sub) throw new Error('Token inválido')
    return payload.sub
  }

  private sign(userId: string): string {
    return jwt.sign({ sub: userId }, jwtSecret(), { expiresIn: '7d' })
  }
}
