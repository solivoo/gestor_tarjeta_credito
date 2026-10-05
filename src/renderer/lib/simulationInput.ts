import type { CreditCard, Statement } from '../../shared/types/entities'
import { RateMethod } from '../../shared/types/enums'
import type { SimulationInput } from '../../shared/types/simulation'
import { toMonthlyRate } from '../../domain/interest/rates'
import { moneyString } from '../../domain/money'

/**
 * Construye el input de simulación desde tarjeta + último statement.
 * Usa saldo CORRIENTE (rotativo) como principal: el diferido ya trae cuota propia
 * y no debe capitalizarse otra vez con la tasa revolvente.
 */
export function buildSimulationInput(
  card: CreditCard,
  statement: Statement,
): SimulationInput {
  const resolved = toMonthlyRate({
    rateMethod: card.rateMethod,
    annualInterestRate: card.annualInterestRate,
    monthlyInterestRate: card.monthlyInterestRate,
  })

  return {
    principal: statement.currentBalance,
    deferredBalance: statement.deferredBalance,
    annualInterestRate: card.annualInterestRate,
    monthlyInterestRate: moneyString(resolved.monthlyRate),
    // Tras resolver la tasa, el motor puede usar MONTHLY_DIRECT con el valor ya convertido.
    rateMethod: RateMethod.MONTHLY_DIRECT,
    minimumPayment: statement.minimumPayment,
    minimumPaymentRule: card.minimumPaymentRule,
    extraPayment: '0',
    newMonthlyPurchases: '0',
    fees: '0',
  }
}
