import { TransactionType } from '../../shared/types/enums'
import type { TransactionType as TransactionTypeT } from '../../shared/types/enums'

export interface NormalizationPattern {
  pattern: RegExp
  type: TransactionTypeT
  priority: number
}

const DEFAULT_PATTERNS: NormalizationPattern[] = [
  { pattern: /interes|interés|int\.?\s*financ/i, type: TransactionType.INTEREST, priority: 100 },
  { pattern: /seguro|insurance/i, type: TransactionType.INSURANCE, priority: 90 },
  { pattern: /iva|impuesto|tax/i, type: TransactionType.TAX, priority: 85 },
  { pattern: /tarifa|comision|comisión|cargo|fee/i, type: TransactionType.FEE, priority: 80 },
  {
    pattern: /avance|cash\s*advance|ventanilla/i,
    type: TransactionType.CASH_ADVANCE,
    priority: 75,
  },
  {
    pattern: /su\s*pago|pago|abono|payment|transferencia\s*recibida/i,
    type: TransactionType.PAYMENT,
    priority: 70,
  },
  {
    pattern: /cuota|diferido|installment/i,
    type: TransactionType.INSTALLMENT,
    priority: 65,
  },
  { pattern: /reembolso|refund|devolucion|devolución/i, type: TransactionType.REFUND, priority: 60 },
  { pattern: /ajuste|adjustment/i, type: TransactionType.ADJUSTMENT, priority: 55 },
]

export function normalizeDescription(description: string): string {
  return description
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function classifyTransactionType(
  description: string,
  extraPatterns: NormalizationPattern[] = [],
): { type: TransactionTypeT; confidence: number } {
  const patterns = [...DEFAULT_PATTERNS, ...extraPatterns].sort(
    (a, b) => b.priority - a.priority,
  )
  for (const rule of patterns) {
    if (rule.pattern.test(description)) {
      return { type: rule.type, confidence: Math.min(0.95, 0.5 + rule.priority / 200) }
    }
  }
  return { type: TransactionType.PURCHASE, confidence: 0.4 }
}
