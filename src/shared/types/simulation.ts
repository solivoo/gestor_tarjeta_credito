import type { ExplainedMoney, MoneyString } from './money'
import type { MinimumPaymentRule, RateMethod } from './entities'

export interface SimulationInstallmentInput {
  id: string
  installmentAmount: MoneyString
  installmentsRemaining: number
  interestRate: MoneyString | null
}

export interface SimulationInput {
  principal: MoneyString
  deferredBalance?: MoneyString
  annualInterestRate?: MoneyString | null
  monthlyInterestRate: MoneyString
  rateMethod: RateMethod
  minimumPayment?: MoneyString | null
  minimumPaymentRule: MinimumPaymentRule
  fixedPayment?: MoneyString | null
  extraPayment?: MoneyString
  newMonthlyPurchases?: MoneyString
  fees?: MoneyString
  installmentPlans?: SimulationInstallmentInput[]
  simulationMonths?: number
}

export interface SimulationMonthAlert {
  code: 'NO_PRINCIPAL_REDUCTION' | 'NEVER_PAYS_OFF' | 'PAYMENT_EXCEEDS_BALANCE'
  message: string
}

export interface SimulationMonth {
  month: number
  startingBalance: ExplainedMoney
  newPurchases: ExplainedMoney
  interest: ExplainedMoney
  fees: ExplainedMoney
  minimumPayment: ExplainedMoney
  extraPayment: ExplainedMoney
  actualPayment: ExplainedMoney
  principalPaid: ExplainedMoney
  endingBalance: ExplainedMoney
  installmentObligations: ExplainedMoney
  alerts: SimulationMonthAlert[]
}

export interface SimulationResult {
  months: SimulationMonth[]
  monthsToPayoff: number | null
  totalInterest: ExplainedMoney
  totalFees: ExplainedMoney
  totalPaid: ExplainedMoney
  neverPaysOff: boolean
  assumptions: string[]
}

export interface ComparisonResult {
  scenarioA: SimulationResult
  scenarioB: SimulationResult
  interestSaved: ExplainedMoney
  monthsSaved: number | null
}

export interface PurchaseImpactInput {
  current: SimulationInput
  purchaseAmount: MoneyString
  termMonths: number
  purchaseMonthlyRate: MoneyString
  treatAsCurrent?: boolean
}

export interface PurchaseImpactResult {
  withoutPurchase: SimulationResult
  withPurchase: SimulationResult
  capitalAdded: ExplainedMoney
  financingCost: ExplainedMoney
  additionalProjectedInterest: ExplainedMoney
  additionalMonths: number | null
  installmentAmount: ExplainedMoney
}
