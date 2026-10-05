import { z } from 'zod'
import { MinimumPaymentRuleKind, RateMethod } from '../types/enums'
import { DEFAULT_CURRENCY } from '../constants'

const moneyString = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, 'Monto inválido')

export const minimumPaymentRuleSchema = z.object({
  kind: z.enum([
    MinimumPaymentRuleKind.PERCENTAGE,
    MinimumPaymentRuleKind.FIXED,
    MinimumPaymentRuleKind.GREATER_OF,
    MinimumPaymentRuleKind.CUSTOM,
  ]),
  percentage: moneyString.optional(),
  fixedAmount: moneyString.optional(),
})

export const createCreditCardSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  issuer: z.string().min(1, 'El emisor es obligatorio'),
  maskedNumber: z.string().nullable().optional(),
  creditLimit: moneyString,
  currency: z.string().default(DEFAULT_CURRENCY),
  annualInterestRate: moneyString.nullable().optional(),
  monthlyInterestRate: moneyString.nullable().optional(),
  rateMethod: z.enum([
    RateMethod.NOMINAL_DIV_12,
    RateMethod.EFFECTIVE_TO_MONTHLY,
    RateMethod.MONTHLY_DIRECT,
  ]),
  minimumPaymentRule: minimumPaymentRuleSchema,
  cutoffDay: z.number().int().min(1, 'Día inválido').max(31, 'Día inválido'),
  paymentDueDay: z.number().int().min(1, 'Día inválido').max(31, 'Día inválido'),
})

export const updateCreditCardSchema = createCreditCardSchema.partial()

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>
