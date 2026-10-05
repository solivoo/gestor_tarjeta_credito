import { existsSync } from 'node:fs'
import { join } from 'node:path'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { initDatabase } from './db/sequelize'
import { authRouter } from './routes/auth'
import { apiRouter } from './routes/api'

async function main() {
  await initDatabase()

  const app = express()
  const port = Number(process.env.PORT ?? 3000)
  const isProd = process.env.NODE_ENV === 'production'

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? true,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })
  app.use('/api/auth', authRouter)
  app.use('/api', apiRouter)

  const webDist = join(process.cwd(), 'dist', 'web')
  if (isProd && existsSync(webDist)) {
    app.use(express.static(webDist))
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(join(webDist, 'index.html'))
    })
  }

  app.listen(port, () => {
    console.log(`API lista en http://localhost:${port}`)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
