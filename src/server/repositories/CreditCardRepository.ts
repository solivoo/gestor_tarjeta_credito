import { v4 as uuid } from 'uuid'
import type { CreateCreditCardInput, UpdateCreditCardInput } from '../../shared/schemas/card'
import type { CreditCard } from '../../shared/types/entities'
import { CreditCardModel } from '../models'
import { mapCreditCard } from './mappers'

export class CreditCardRepository {
  async list(userId: string): Promise<CreditCard[]> {
    const rows = await CreditCardModel.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']],
    })
    return rows.map(mapCreditCard)
  }

  async getById(id: string, userId: string): Promise<CreditCard | null> {
    const row = await CreditCardModel.findOne({ where: { id, userId } })
    return row ? mapCreditCard(row) : null
  }

  async create(userId: string, input: CreateCreditCardInput): Promise<CreditCard> {
    const now = new Date()
    const row = await CreditCardModel.create({
      id: uuid(),
      userId,
      name: input.name,
      issuer: input.issuer,
      maskedNumber: input.maskedNumber ?? null,
      creditLimit: input.creditLimit,
      currency: input.currency,
      annualInterestRate: input.annualInterestRate ?? null,
      monthlyInterestRate: input.monthlyInterestRate ?? null,
      rateMethod: input.rateMethod,
      minimumPaymentRuleJson: JSON.stringify(input.minimumPaymentRule),
      cutoffDay: input.cutoffDay,
      paymentDueDay: input.paymentDueDay,
      createdAt: now,
      updatedAt: now,
    })
    return mapCreditCard(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateCreditCardInput,
  ): Promise<CreditCard> {
    const row = await CreditCardModel.findOne({ where: { id, userId } })
    if (!row) throw new Error(`Tarjeta no encontrada: ${id}`)

    if (input.name != null) row.name = input.name
    if (input.issuer != null) row.issuer = input.issuer
    if (input.maskedNumber !== undefined) row.maskedNumber = input.maskedNumber ?? null
    if (input.creditLimit != null) row.creditLimit = input.creditLimit
    if (input.currency != null) row.currency = input.currency
    if (input.annualInterestRate !== undefined) {
      row.annualInterestRate = input.annualInterestRate ?? null
    }
    if (input.monthlyInterestRate !== undefined) {
      row.monthlyInterestRate = input.monthlyInterestRate ?? null
    }
    if (input.rateMethod != null) row.rateMethod = input.rateMethod
    if (input.minimumPaymentRule != null) {
      row.minimumPaymentRuleJson = JSON.stringify(input.minimumPaymentRule)
    }
    if (input.cutoffDay != null) row.cutoffDay = input.cutoffDay
    if (input.paymentDueDay != null) row.paymentDueDay = input.paymentDueDay
    row.updatedAt = new Date()
    await row.save()
    return mapCreditCard(row)
  }

  async delete(id: string, userId: string): Promise<void> {
    await CreditCardModel.destroy({ where: { id, userId } })
  }
}
