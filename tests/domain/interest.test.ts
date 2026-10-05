import { describe, expect, it } from 'vitest'
import { calculateMinimumPayment } from '../../src/domain/interest/minimumPayment'
import { estimatePeriodInterest, toMonthlyRate } from '../../src/domain/interest/rates'
import { d } from '../../src/domain/money'
import { MinimumPaymentRuleKind, RateMethod } from '../../src/shared/types/enums'

describe('interest rates', () => {
  it('converts nominal annual to monthly', () => {
    const result = toMonthlyRate({
      rateMethod: RateMethod.NOMINAL_DIV_12,
      annualInterestRate: '0.24',
    })
    expect(result.monthlyRate.toString()).toBe('0.02')
    expect(result.formulaId).toBe('nominal_div_12')
  })

  it('converts effective annual to monthly', () => {
    const result = toMonthlyRate({
      rateMethod: RateMethod.EFFECTIVE_TO_MONTHLY,
      annualInterestRate: '0.24',
    })
    expect(result.monthlyRate.toNumber()).toBeCloseTo(0.018088, 5)
  })

  it('uses monthly direct', () => {
    const result = toMonthlyRate({
      rateMethod: RateMethod.MONTHLY_DIRECT,
      monthlyInterestRate: '0.02',
    })
    expect(result.monthlyRate.toString()).toBe('0.02')
  })

  it('estimates period interest', () => {
    expect(estimatePeriodInterest(d(1000), d(0.02)).toString()).toBe('20')
  })
})

describe('minimum payment', () => {
  it('uses statement minimum when provided', () => {
    const result = calculateMinimumPayment(
      d(1000),
      { kind: MinimumPaymentRuleKind.PERCENTAGE, percentage: '0.05' },
      '130',
    )
    expect(result.amount.toString()).toBe('130')
    expect(result.formulaId).toBe('statement_minimum')
  })

  it('computes percentage minimum', () => {
    const result = calculateMinimumPayment(
      d(1000),
      { kind: MinimumPaymentRuleKind.PERCENTAGE, percentage: '0.05' },
      null,
    )
    expect(result.amount.toString()).toBe('50')
  })

  it('uses greater of fixed and percentage', () => {
    const result = calculateMinimumPayment(
      d(1000),
      {
        kind: MinimumPaymentRuleKind.GREATER_OF,
        percentage: '0.02',
        fixedAmount: '30',
      },
      null,
    )
    expect(result.amount.toString()).toBe('30')
  })
})
