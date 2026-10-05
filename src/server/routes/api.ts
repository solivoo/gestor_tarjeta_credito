import { Router } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth'
import {
  CardService,
  ImportService,
  PaymentService,
  SimulationService,
  StatementService,
  TransactionService,
} from '../services'

export const apiRouter = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } })

const cards = new CardService()
const statements = new StatementService()
const transactions = new TransactionService()
const payments = new PaymentService()
const imports = new ImportService()
const simulate = new SimulationService()

apiRouter.use(requireAuth)

function userId(req: import('express').Request): string {
  return (req as AuthedRequest).userId
}

function sendError(res: import('express').Response, error: unknown, status = 400): void {
  if (error instanceof ZodError) {
    res.status(status).json({ error: error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }
  const message = error instanceof Error ? error.message : 'Error'
  res.status(status).json({ error: message })
}

apiRouter.get('/cards', async (req, res) => {
  try {
    res.json(await cards.list(userId(req)))
  } catch (error) {
    sendError(res, error, 500)
  }
})

apiRouter.get('/cards/:id', async (req, res) => {
  try {
    const card = await cards.get(userId(req), req.params.id)
    if (!card) {
      res.status(404).json({ error: 'Tarjeta no encontrada' })
      return
    }
    res.json(card)
  } catch (error) {
    sendError(res, error, 500)
  }
})

apiRouter.post('/cards', async (req, res) => {
  try {
    res.status(201).json(await cards.create(userId(req), req.body))
  } catch (error) {
    sendError(res, error)
  }
})

apiRouter.put('/cards/:id', async (req, res) => {
  try {
    res.json(await cards.update(userId(req), req.params.id, req.body))
  } catch (error) {
    sendError(res, error)
  }
})

apiRouter.delete('/cards/:id', async (req, res) => {
  try {
    await cards.delete(userId(req), req.params.id)
    res.json({ ok: true })
  } catch (error) {
    sendError(res, error)
  }
})

apiRouter.get('/statements', async (req, res) => {
  try {
    const creditCardId =
      typeof req.query.creditCardId === 'string' ? req.query.creditCardId : undefined
    res.json(await statements.list(userId(req), creditCardId))
  } catch (error) {
    sendError(res, error, 500)
  }
})

apiRouter.get('/transactions', async (req, res) => {
  try {
    res.json(
      await transactions.list(userId(req), {
        creditCardId:
          typeof req.query.creditCardId === 'string' ? req.query.creditCardId : undefined,
        statementId:
          typeof req.query.statementId === 'string' ? req.query.statementId : undefined,
      }),
    )
  } catch (error) {
    sendError(res, error, 500)
  }
})

apiRouter.get('/payments', async (req, res) => {
  try {
    const creditCardId =
      typeof req.query.creditCardId === 'string' ? req.query.creditCardId : undefined
    res.json(await payments.list(userId(req), creditCardId))
  } catch (error) {
    sendError(res, error, 500)
  }
})

apiRouter.get('/import/batches', async (req, res) => {
  try {
    const creditCardId =
      typeof req.query.creditCardId === 'string' ? req.query.creditCardId : undefined
    res.json(await imports.listBatches(userId(req), creditCardId))
  } catch (error) {
    sendError(res, error, 500)
  }
})

apiRouter.delete('/import/batches/:id', async (req, res) => {
  try {
    res.json(await imports.deleteBatch(userId(req), req.params.id))
  } catch (error) {
    sendError(res, error)
  }
})

apiRouter.post('/import/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Archivo requerido' })
      return
    }
    const creditCardId =
      typeof req.body.creditCardId === 'string' ? req.body.creditCardId : undefined
    res.json(
      await imports.previewFromBuffer(
        userId(req),
        req.file.buffer,
        req.file.originalname,
        creditCardId,
      ),
    )
  } catch (error) {
    sendError(res, error)
  }
})

apiRouter.post('/import/commit', async (req, res) => {
  try {
    res.json(await imports.commit(userId(req), req.body))
  } catch (error) {
    sendError(res, error)
  }
})

apiRouter.post('/simulate/compare', async (req, res) => {
  try {
    const { base, extraPayment } = req.body as { base: unknown; extraPayment: string }
    res.json(simulate.compare(base as never, String(extraPayment ?? '0')))
  } catch (error) {
    sendError(res, error)
  }
})

apiRouter.post('/simulate/debt', async (req, res) => {
  try {
    res.json(simulate.debt(req.body))
  } catch (error) {
    sendError(res, error)
  }
})
