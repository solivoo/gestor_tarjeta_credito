import { MinimumPaymentRuleKind } from '../../shared/types/enums'
import type { MinimumPaymentRule } from '../../shared/types/entities'
import { Decimal, d, max0 } from '../money'

export function calculateMinimumPayment(
  balanceWithCharges: Decimal,
  rule: MinimumPaymentRule,
  statementMinimum?: string | null,
): { amount: Decimal; formulaId: string; inputs: Record<string, string> } {
  if (statementMinimum != null && statementMinimum !== '') {
    const amount = max0(d(statementMinimum))
    return {
      amount,
      formulaId: 'statement_minimum',
      inputs: { statementMinimum: amount.toString() },
    }
  }

  const percentage = rule.percentage != null ? d(rule.percentage) : d(0)
  const fixed = rule.fixedAmount != null ? d(rule.fixedAmount) : d(0)
  const percentAmount = balanceWithCharges.times(percentage)

  switch (rule.kind) {
    case MinimumPaymentRuleKind.PERCENTAGE: {
      const amount = max0(percentAmount)
      return {
        amount,
        formulaId: 'min_percentage',
        inputs: {
          balance: balanceWithCharges.toString(),
          percentage: percentage.toString(),
        },
      }
    }
    case MinimumPaymentRuleKind.FIXED: {
      const amount = Decimal.min(max0(fixed), max0(balanceWithCharges))
      return {
        amount,
        formulaId: 'min_fixed',
        inputs: { fixedAmount: fixed.toString() },
      }
    }
    case MinimumPaymentRuleKind.GREATER_OF: {
      const amount = Decimal.min(
        max0(Decimal.max(fixed, percentAmount)),
        max0(balanceWithCharges),
      )
      return {
        amount,
        formulaId: 'min_greater_of',
        inputs: {
          fixedAmount: fixed.toString(),
          percentage: percentage.toString(),
          percentAmount: percentAmount.toString(),
        },
      }
    }
    default: {
      const amount = max0(percentAmount)
      return {
        amount,
        formulaId: 'min_custom_fallback_percentage',
        inputs: {
          balance: balanceWithCharges.toString(),
          percentage: percentage.toString(),
        },
      }
    }
  }
}
