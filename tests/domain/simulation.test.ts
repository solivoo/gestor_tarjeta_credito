import { describe, expect, it } from 'vitest'
import {
  compareScenarios,
  simulateDebt,
  simulateMinimumPayment,
  simulateMinimumPlusExtra,
  simulateNewPurchaseImpact,
} from '../../src/domain/simulations'
import { d } from '../../src/domain/money'
import { MinimumPaymentRuleKind, RateMethod } from '../../src/shared/types/enums'
import type { SimulationInput } from '../../src/shared/types/simulation'

const baseInput: SimulationInput = {
  principal: '1000',
  monthlyInterestRate: '0.02',
  rateMethod: RateMethod.MONTHLY_DIRECT,
  minimumPaymentRule: {
    kind: MinimumPaymentRuleKind.FIXED,
    fixedAmount: '100',
  },
  extraPayment: '0',
  newMonthlyPurchases: '0',
  fees: '0',
}

describe('DebtSimulationEngine', () => {
  it('amortizes capital after interest: 1000 @ 2% paying 100', () => {
    const result = simulateDebt({
      ...baseInput,
      fixedPayment: '100',
      simulationMonths: 1,
    })
    const month = result.months[0]
    expect(month.interest.amount).toBe('20.000000')
    expect(month.principalPaid.amount).toBe('80.000000')
    expect(month.endingBalance.amount).toBe('920.000000')
    expect(month.interest.provenance).toBe('ESTIMATED')
  })

  it('handles zero interest', () => {
    const result = simulateDebt({
      ...baseInput,
      monthlyInterestRate: '0',
      fixedPayment: '100',
      simulationMonths: 1,
    })
    expect(d(result.months[0].interest.amount).toNumber()).toBe(0)
    expect(d(result.months[0].endingBalance.amount).toNumber()).toBe(900)
  })

  it('clamps when payment exceeds balance', () => {
    const result = simulateDebt({
      ...baseInput,
      principal: '50',
      fixedPayment: '100',
      simulationMonths: 1,
    })
    expect(d(result.months[0].endingBalance.amount).toNumber()).toBe(0)
    expect(result.months[0].alerts.some((a) => a.code === 'PAYMENT_EXCEEDS_BALANCE')).toBe(
      true,
    )
  })

  it('alerts when payment does not reduce principal', () => {
    const result = simulateDebt({
      ...baseInput,
      fixedPayment: '10',
      simulationMonths: 1,
    })
    expect(result.months[0].alerts.some((a) => a.code === 'NO_PRINCIPAL_REDUCTION')).toBe(true)
  })

  it('handles minimum lower than accrued interest via fixed small payment', () => {
    const result = simulateMinimumPayment({
      ...baseInput,
      minimumPayment: '5',
      minimumPaymentRule: {
        kind: MinimumPaymentRuleKind.FIXED,
        fixedAmount: '5',
      },
      simulationMonths: 1,
    })
    expect(d(result.months[0].interest.amount).toNumber()).toBe(20)
    expect(d(result.months[0].principalPaid.amount).toNumber()).toBe(0)
  })

  it('extra payment reduces months and interest vs minimum', () => {
    const comparison = compareScenarios(
      {
        ...baseInput,
        minimumPayment: '50',
        minimumPaymentRule: {
          kind: MinimumPaymentRuleKind.FIXED,
          fixedAmount: '50',
        },
      },
      '50',
    )
    expect(comparison.scenarioB.monthsToPayoff).not.toBeNull()
    expect(comparison.scenarioA.monthsToPayoff).not.toBeNull()
    expect(comparison.scenarioB.monthsToPayoff!).toBeLessThan(
      comparison.scenarioA.monthsToPayoff!,
    )
    expect(d(comparison.interestSaved.amount).toNumber()).toBeGreaterThan(0)
    expect(comparison.monthsSaved).toBeGreaterThan(0)
  })

  it('simulateMinimumPlusExtra matches compare scenario B', () => {
    const input = {
      ...baseInput,
      minimumPayment: '50',
      minimumPaymentRule: {
        kind: MinimumPaymentRuleKind.FIXED,
        fixedAmount: '50',
      },
    }
    const plus = simulateMinimumPlusExtra(input, '25')
    const cmp = compareScenarios(input, '25')
    expect(plus.monthsToPayoff).toBe(cmp.scenarioB.monthsToPayoff)
  })

  it('supports long simulations up to payoff', () => {
    const result = simulateMinimumPayment({
      ...baseInput,
      principal: '500',
      minimumPayment: '40',
      minimumPaymentRule: { kind: MinimumPaymentRuleKind.FIXED, fixedAmount: '40' },
    })
    expect(result.monthsToPayoff).not.toBeNull()
    expect(result.monthsToPayoff!).toBeLessThan(600)
  })

  it('rounds internally with Decimal precision', () => {
    const result = simulateDebt({
      ...baseInput,
      principal: '1000.125',
      monthlyInterestRate: '0.0155',
      fixedPayment: '87.33',
      simulationMonths: 1,
    })
    expect(result.months[0].endingBalance.amount).toMatch(/^\d+\.\d{6}$/)
  })

  it('estimates new purchase impact', () => {
    const impact = simulateNewPurchaseImpact({
      current: {
        ...baseInput,
        minimumPayment: '50',
        minimumPaymentRule: { kind: MinimumPaymentRuleKind.FIXED, fixedAmount: '50' },
      },
      purchaseAmount: '300',
      termMonths: 12,
      purchaseMonthlyRate: '0.02',
    })
    expect(d(impact.capitalAdded.amount).toNumber()).toBe(300)
    expect(d(impact.installmentAmount.amount).toNumber()).toBeGreaterThan(0)
    expect(d(impact.financingCost.amount).toNumber()).toBeGreaterThan(0)
  })
})
