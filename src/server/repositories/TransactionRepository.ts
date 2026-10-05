import { Op } from 'sequelize'
import { v4 as uuid } from 'uuid'
import type { Transaction } from '../../shared/types/entities'
import type { TransactionPurpose, TransactionSource, TransactionType } from '../../shared/types/enums'
import { TransactionModel } from '../models'
import { mapTransaction } from './mappers'

export interface CreateTransactionRecord {
  userId: string
  statementId: string | null
  creditCardId: string
  date: string
  description: string
  originalDescription: string
  normalizedDescription: string
  amount: string
  type: TransactionType
  category?: string | null
  installmentId?: string | null
  currency?: string
  source: TransactionSource
  purpose?: TransactionPurpose
  fingerprint: string
}

export class TransactionRepository {
  async list(
    userId: string,
    filters?: { creditCardId?: string; statementId?: string },
  ): Promise<Transaction[]> {
    const where: Record<string, string> = { userId }
    if (filters?.creditCardId) where.creditCardId = filters.creditCardId
    if (filters?.statementId) where.statementId = filters.statementId
    const rows = await TransactionModel.findAll({
      where,
      order: [['date', 'DESC']],
    })
    return rows.map(mapTransaction)
  }

  async findFingerprints(userId: string, fingerprints: string[]): Promise<Set<string>> {
    if (!fingerprints.length) return new Set()
    const rows = await TransactionModel.findAll({
      where: { userId, fingerprint: { [Op.in]: fingerprints } },
      attributes: ['fingerprint'],
    })
    return new Set(rows.map((r) => r.fingerprint))
  }

  async deleteByStatementIds(statementIds: string[], userId: string): Promise<void> {
    if (!statementIds.length) return
    await TransactionModel.destroy({
      where: { statementId: { [Op.in]: statementIds }, userId },
    })
  }

  async createMany(records: CreateTransactionRecord[]): Promise<number> {
    if (!records.length) return 0
    await TransactionModel.bulkCreate(
      records.map((r) => ({
        id: uuid(),
        userId: r.userId,
        statementId: r.statementId,
        creditCardId: r.creditCardId,
        date: r.date,
        description: r.description,
        originalDescription: r.originalDescription,
        normalizedDescription: r.normalizedDescription,
        amount: r.amount,
        type: r.type,
        category: r.category ?? null,
        installmentId: r.installmentId ?? null,
        currency: r.currency ?? 'USD',
        source: r.source,
        purpose: r.purpose ?? 'UNKNOWN',
        fingerprint: r.fingerprint,
        createdAt: new Date(),
      })),
    )
    return records.length
  }
}
