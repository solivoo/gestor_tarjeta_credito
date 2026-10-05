import { describe, expect, it } from 'vitest'
import {
  classifyTransactionType,
  normalizeDescription,
  transactionFingerprint,
} from '../../src/domain/normalization'
import { TransactionType } from '../../src/shared/types/enums'

describe('normalization', () => {
  it('normalizes descriptions', () => {
    expect(normalizeDescription('Interés de Financiamiento')).toBe('INTERES DE FINANCIAMIENTO')
  })

  it('classifies interest variants', () => {
    expect(classifyTransactionType('INTERES FINANCIAMIENTO').type).toBe(
      TransactionType.INTEREST,
    )
    expect(classifyTransactionType('INT. FINANC.').type).toBe(TransactionType.INTEREST)
  })

  it('classifies cash advances', () => {
    expect(classifyTransactionType('AVANCE VENTANILLA').type).toBe(
      TransactionType.CASH_ADVANCE,
    )
  })

  it('builds stable fingerprints', () => {
    const a = transactionFingerprint({
      date: '2026-01-01',
      description: 'Pago Tarjeta',
      amount: '100.00',
      cardId: 'card-1',
    })
    const b = transactionFingerprint({
      date: '2026-01-01',
      description: 'pago  tarjeta',
      amount: '100.00',
      cardId: 'card-1',
    })
    expect(a).toBe(b)
  })
})
