import { Op } from 'sequelize'
import { v4 as uuid } from 'uuid'
import type { CreateStatementInput } from '../../shared/ipc/api'
import type { Statement } from '../../shared/types/entities'
import { StatementModel } from '../models'
import { mapStatement } from './mappers'

export class StatementRepository {
  async list(userId: string, creditCardId?: string): Promise<Statement[]> {
    const where: Record<string, string> = { userId }
    if (creditCardId) where.creditCardId = creditCardId
    const rows = await StatementModel.findAll({
      where,
      order: [['statementDate', 'DESC']],
    })
    return rows.map(mapStatement)
  }

  async getById(id: string, userId: string): Promise<Statement | null> {
    const row = await StatementModel.findOne({ where: { id, userId } })
    return row ? mapStatement(row) : null
  }

  async listByImportBatchId(importBatchId: string, userId: string): Promise<Statement[]> {
    const rows = await StatementModel.findAll({ where: { importBatchId, userId } })
    return rows.map(mapStatement)
  }

  async deleteByIds(ids: string[], userId: string): Promise<void> {
    if (!ids.length) return
    await StatementModel.destroy({ where: { id: { [Op.in]: ids }, userId } })
  }

  async create(
    userId: string,
    input: CreateStatementInput & { importBatchId?: string | null },
  ): Promise<Statement> {
    const row = await StatementModel.create({
      id: uuid(),
      userId,
      creditCardId: input.creditCardId,
      importBatchId: input.importBatchId ?? null,
      statementDate: input.statementDate,
      periodStart: input.periodStart ?? null,
      periodEnd: input.periodEnd ?? null,
      previousBalance: input.previousBalance,
      currentBalance: input.currentBalance,
      deferredBalance: input.deferredBalance ?? '0',
      totalDebt: input.totalDebt,
      minimumPayment: input.minimumPayment,
      totalPaymentDue: input.totalPaymentDue,
      availableCredit: input.availableCredit ?? null,
      creditLimit: input.creditLimit ?? null,
      interestCharged: input.interestCharged ?? '0',
      feesCharged: input.feesCharged ?? '0',
      insuranceCharged: input.insuranceCharged ?? '0',
      taxesCharged: input.taxesCharged ?? '0',
      paymentsReceived: input.paymentsReceived ?? '0',
      newPurchases: input.newPurchases ?? '0',
      cashAdvances: input.cashAdvances ?? '0',
      provenanceNotes: input.provenanceNotes ?? null,
      createdAt: new Date(),
    })
    return mapStatement(row)
  }
}
