import Decimal from 'decimal.js'
import { MONEY_DISPLAY_DECIMALS, MONEY_INTERNAL_DECIMALS } from '../../shared/constants'

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
})

export { Decimal }

export function d(value: Decimal.Value): Decimal {
  return new Decimal(value)
}

export function moneyString(value: Decimal.Value): string {
  return d(value).toFixed(MONEY_INTERNAL_DECIMALS)
}

export function formatMoney(value: Decimal.Value, decimals = MONEY_DISPLAY_DECIMALS): string {
  return d(value).toFixed(decimals)
}

export function max0(value: Decimal): Decimal {
  return Decimal.max(value, 0)
}

export function clampNonNegative(value: Decimal): Decimal {
  return max0(value)
}
