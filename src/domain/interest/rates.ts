import { RateMethod } from '../../shared/types/enums'
import type { RateMethod as RateMethodT } from '../../shared/types/enums'
import { Decimal, d, moneyString } from '../money'

export interface MonthlyRateResult {
  monthlyRate: Decimal
  formulaId: string
  inputs: Record<string, string>
}

/**
 * Convert stored rates to a monthly rate using an explicit methodology.
 */
export function toMonthlyRate(params: {
  rateMethod: RateMethodT
  annualInterestRate?: string | null
  monthlyInterestRate?: string | null
}): MonthlyRateResult {
  const { rateMethod, annualInterestRate, monthlyInterestRate } = params

  if (rateMethod === RateMethod.MONTHLY_DIRECT) {
    if (monthlyInterestRate == null) {
      throw new Error('MONTHLY_DIRECT requiere monthlyInterestRate')
    }
    const monthlyRate = d(monthlyInterestRate)
    return {
      monthlyRate,
      formulaId: 'monthly_direct',
      inputs: { monthlyInterestRate: moneyString(monthlyRate) },
    }
  }

  if (annualInterestRate == null) {
    throw new Error(`${rateMethod} requiere annualInterestRate`)
  }

  const annual = d(annualInterestRate)

  if (rateMethod === RateMethod.NOMINAL_DIV_12) {
    const monthlyRate = annual.div(12)
    return {
      monthlyRate,
      formulaId: 'nominal_div_12',
      inputs: {
        annualNominalRate: moneyString(annual),
        monthlyRate: moneyString(monthlyRate),
      },
    }
  }

  // EFFECTIVE_TO_MONTHLY: (1 + ea)^(1/12) - 1
  const monthlyRate = annual.plus(1).pow(d(1).div(12)).minus(1)
  return {
    monthlyRate,
    formulaId: 'effective_to_monthly',
    inputs: {
      annualEffectiveRate: moneyString(annual),
      monthlyRate: moneyString(monthlyRate),
    },
  }
}

export function estimatePeriodInterest(balance: Decimal, monthlyRate: Decimal): Decimal {
  return balance.times(monthlyRate)
}
