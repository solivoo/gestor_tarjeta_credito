import { MAX_SIMULATION_MONTHS } from '../../shared/constants'
import type {
  ComparisonResult,
  PurchaseImpactInput,
  PurchaseImpactResult,
  SimulationInput,
  SimulationMonth,
  SimulationMonthAlert,
  SimulationResult,
} from '../../shared/types/simulation'
import { calculateMinimumPayment } from '../interest/minimumPayment'
import { estimatePeriodInterest, toMonthlyRate } from '../interest/rates'
import { Decimal, clampNonNegative, d, estimated, moneyString } from '../money'

function installmentObligation(plans: SimulationInput['installmentPlans']): Decimal {
  if (!plans?.length) return d(0)
  return plans.reduce((sum, plan) => {
    if (plan.installmentsRemaining <= 0) return sum
    return sum.plus(d(plan.installmentAmount))
  }, d(0))
}

function advanceInstallments(
  plans: NonNullable<SimulationInput['installmentPlans']>,
): NonNullable<SimulationInput['installmentPlans']> {
  return plans.map((plan) => ({
    ...plan,
    installmentsRemaining: Math.max(0, plan.installmentsRemaining - 1),
  }))
}

export function simulateDebt(input: SimulationInput): SimulationResult {
  const maxMonths = input.simulationMonths ?? MAX_SIMULATION_MONTHS
  const rate = toMonthlyRate({
    rateMethod: input.rateMethod,
    annualInterestRate: input.annualInterestRate,
    monthlyInterestRate: input.monthlyInterestRate,
  })

  let balance = clampNonNegative(d(input.principal))
  let plans = [...(input.installmentPlans ?? [])]
  let statementMinimum = input.minimumPayment ?? null
  const months: SimulationMonth[] = []
  let totalInterest = d(0)
  let totalFees = d(0)
  let totalPaid = d(0)
  let neverPaysOff = false

  const assumptions = [
    `Proyección basada en una tasa mensual de ${moneyString(rate.monthlyRate)} (${rate.formulaId}).`,
    'Los intereses proyectados son ESTIMADOS, no valores cobrados por el banco.',
  ]

  for (let month = 1; month <= maxMonths; month += 1) {
    if (balance.lte(0)) break

    const startingBalance = balance
    const newPurchases = d(input.newMonthlyPurchases ?? '0')
    const fees = d(input.fees ?? '0')
    const interest = estimatePeriodInterest(startingBalance, rate.monthlyRate)
    const installmentDue = installmentObligation(plans)

    const balanceWithCharges = startingBalance
      .plus(newPurchases)
      .plus(interest)
      .plus(fees)
      .plus(installmentDue)

    const minCalc = calculateMinimumPayment(
      balanceWithCharges,
      input.minimumPaymentRule,
      statementMinimum,
    )

    const minimumPayment = minCalc.amount
    const extraPayment = d(input.extraPayment ?? '0')
    let actualPayment =
      input.fixedPayment != null && input.fixedPayment !== ''
        ? d(input.fixedPayment)
        : minimumPayment.plus(extraPayment)

    const alerts: SimulationMonthAlert[] = []

    if (actualPayment.gte(balanceWithCharges)) {
      actualPayment = balanceWithCharges
      alerts.push({
        code: 'PAYMENT_EXCEEDS_BALANCE',
        message: 'El pago cubre el saldo proyectado del período.',
      })
    }

    const nonPrincipal = interest.plus(fees)
    if (actualPayment.lte(nonPrincipal) && balanceWithCharges.gt(0)) {
      alerts.push({
        code: 'NO_PRINCIPAL_REDUCTION',
        message: 'El pago realizado prácticamente no está reduciendo capital.',
      })
    }

    const principalPaid = Decimal.max(actualPayment.minus(nonPrincipal), 0)
    let endingBalance = clampNonNegative(balanceWithCharges.minus(actualPayment))

    months.push({
      month,
      startingBalance: estimated(startingBalance, 'starting_balance'),
      newPurchases: estimated(newPurchases, 'new_monthly_purchases', {
        newMonthlyPurchases: moneyString(newPurchases),
      }),
      interest: estimated(interest, 'interest_balance_times_rate', {
        balance: moneyString(startingBalance),
        monthlyRate: moneyString(rate.monthlyRate),
        rateFormulaId: rate.formulaId,
      }),
      fees: estimated(fees, 'monthly_fees'),
      minimumPayment: estimated(minimumPayment, minCalc.formulaId, minCalc.inputs),
      extraPayment: estimated(extraPayment, 'extra_payment'),
      actualPayment: estimated(actualPayment, 'actual_payment'),
      principalPaid: estimated(principalPaid, 'principal_paid_payment_minus_interest_fees', {
        payment: moneyString(actualPayment),
        interest: moneyString(interest),
        fees: moneyString(fees),
      }),
      endingBalance: estimated(endingBalance, 'ending_balance'),
      installmentObligations: estimated(installmentDue, 'installment_obligations'),
      alerts,
    })

    totalInterest = totalInterest.plus(interest)
    totalFees = totalFees.plus(fees)
    totalPaid = totalPaid.plus(actualPayment)
    balance = endingBalance
    plans = advanceInstallments(plans)

    // Clear one-shot statement minimum after month 1; later months use the card rule.
    statementMinimum = null

    if (
      month >= 12 &&
      principalPaid.lte(0) &&
      endingBalance.gte(startingBalance)
    ) {
      neverPaysOff = true
      months[months.length - 1]?.alerts.push({
        code: 'NEVER_PAYS_OFF',
        message: 'Con este pago la deuda no disminuye de forma sostenible.',
      })
      break
    }
  }

  if (balance.gt(0) && !neverPaysOff && months.length >= maxMonths) {
    neverPaysOff = true
  }

  return {
    months,
    monthsToPayoff: balance.lte(0) ? months.length : null,
    totalInterest: estimated(totalInterest, 'sum_estimated_interest'),
    totalFees: estimated(totalFees, 'sum_estimated_fees'),
    totalPaid: estimated(totalPaid, 'sum_payments'),
    neverPaysOff,
    assumptions,
  }
}

export function simulateMinimumPayment(input: SimulationInput): SimulationResult {
  return simulateDebt({ ...input, extraPayment: '0', fixedPayment: null })
}

export function simulateMinimumPlusExtra(
  input: SimulationInput,
  extraAmount: string,
): SimulationResult {
  return simulateDebt({ ...input, extraPayment: extraAmount, fixedPayment: null })
}

export function compareScenarios(
  base: SimulationInput,
  extraPayment: string,
): ComparisonResult {
  const scenarioA = simulateMinimumPayment(base)
  const scenarioB = simulateMinimumPlusExtra(base, extraPayment)

  const interestA = d(scenarioA.totalInterest.amount)
  const interestB = d(scenarioB.totalInterest.amount)
  const interestSaved = Decimal.max(interestA.minus(interestB), 0)

  let monthsSaved: number | null = null
  if (scenarioA.monthsToPayoff != null && scenarioB.monthsToPayoff != null) {
    monthsSaved = Math.max(0, scenarioA.monthsToPayoff - scenarioB.monthsToPayoff)
  }

  return {
    scenarioA,
    scenarioB,
    interestSaved: estimated(interestSaved, 'interest_saved_a_minus_b', {
      interestA: scenarioA.totalInterest.amount,
      interestB: scenarioB.totalInterest.amount,
    }),
    monthsSaved,
  }
}

export function simulateNewPurchaseImpact(input: PurchaseImpactInput): PurchaseImpactResult {
  const withoutPurchase = simulateMinimumPayment(input.current)

  const purchase = d(input.purchaseAmount)
  const term = Math.max(1, input.termMonths)
  const purchaseRate = d(input.purchaseMonthlyRate)

  let installmentAmount: Decimal
  let financingCost: Decimal

  if (input.treatAsCurrent || term === 1) {
    installmentAmount = purchase
    financingCost = d(0)
  } else if (purchaseRate.eq(0)) {
    installmentAmount = purchase.div(term)
    financingCost = d(0)
  } else {
    // Standard annuity: P * i(1+i)^n / ((1+i)^n - 1)
    const onePlus = purchaseRate.plus(1)
    const factor = onePlus.pow(term)
    installmentAmount = purchase.times(purchaseRate).times(factor).div(factor.minus(1))
    financingCost = installmentAmount.times(term).minus(purchase)
  }

  const withPurchaseInput: SimulationInput = {
    ...input.current,
    principal: moneyString(d(input.current.principal).plus(purchase)),
    installmentPlans: [
      ...(input.current.installmentPlans ?? []),
      ...(input.treatAsCurrent
        ? []
        : [
            {
              id: 'new-purchase',
              installmentAmount: moneyString(installmentAmount),
              installmentsRemaining: term,
              interestRate: moneyString(purchaseRate),
            },
          ]),
    ],
  }

  const withPurchase = simulateMinimumPayment(withPurchaseInput)

  const interestDelta = Decimal.max(
    d(withPurchase.totalInterest.amount).minus(d(withoutPurchase.totalInterest.amount)),
    0,
  )

  let additionalMonths: number | null = null
  if (withoutPurchase.monthsToPayoff != null && withPurchase.monthsToPayoff != null) {
    additionalMonths = Math.max(0, withPurchase.monthsToPayoff - withoutPurchase.monthsToPayoff)
  }

  return {
    withoutPurchase,
    withPurchase,
    capitalAdded: estimated(purchase, 'purchase_capital'),
    financingCost: estimated(financingCost, 'purchase_financing_cost'),
    additionalProjectedInterest: estimated(interestDelta, 'additional_projected_interest'),
    additionalMonths,
    installmentAmount: estimated(installmentAmount, 'purchase_installment_amount'),
  }
}
