import { Op } from 'sequelize'
import { v4 as uuid } from 'uuid'
import type { CreatePaymentInput } from '../../shared/ipc/api'
import type { Payment } from '../../shared/types/entities'
import { TransactionSource } from '../../shared/types/enums'
import { PaymentModel } from '../models'
import { mapPayment } from './mappers'

export class PaymentRepository {
  async list(userId: string, creditCardId?: string): Promise<Payment[]> {
    const where: Record<string, string> = { userId }
    if (creditCardId) where.creditCardId = creditCardId
    const rows = await PaymentModel.findAll({
      where,
      order: [['date', 'DESC']],
    })
    return rows.map(mapPayment)
  }

  async create(userId: string, input: CreatePaymentInput): Promise<Payment> {
    const row = await PaymentModel.create({
      id: uuid(),
      userId,
      creditCardId: input.creditCardId,
      date: input.date,
      amount: input.amount,
      statementId: input.statementId ?? null,
      source: TransactionSource.MANUAL,
      createdAt: new Date(),
    })
    return mapPayment(row)
  }

  async deleteByStatementIds(statementIds: string[], userId: string): Promise<void> {
    if (!statementIds.length) return
    await PaymentModel.destroy({
      where: { statementId: { [Op.in]: statementIds }, userId },
    })
  }

  async createMany(
    userId: string,
    inputs: Array<CreatePaymentInput & { source?: string }>,
  ): Promise<number> {
    if (!inputs.length) return 0
    await PaymentModel.bulkCreate(
      inputs.map((input) => ({
        id: uuid(),
        userId,
        creditCardId: input.creditCardId,
        date: input.date,
        amount: input.amount,
        statementId: input.statementId ?? null,
        source: input.source ?? TransactionSource.IMPORT,
        createdAt: new Date(),
      })),
    )
    return inputs.length
  }
}
