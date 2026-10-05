export const TransactionType = {
  PURCHASE: 'PURCHASE',
  PAYMENT: 'PAYMENT',
  INTEREST: 'INTEREST',
  FEE: 'FEE',
  TAX: 'TAX',
  CASH_ADVANCE: 'CASH_ADVANCE',
  INSURANCE: 'INSURANCE',
  INSTALLMENT: 'INSTALLMENT',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT',
  OTHER: 'OTHER',
} as const

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]

export const TransactionSource = {
  IMPORT: 'IMPORT',
  MANUAL: 'MANUAL',
} as const

export type TransactionSource = (typeof TransactionSource)[keyof typeof TransactionSource]

export const TransactionPurpose = {
  PERSONAL: 'PERSONAL',
  BUSINESS: 'BUSINESS',
  SHARED: 'SHARED',
  UNKNOWN: 'UNKNOWN',
} as const

export type TransactionPurpose = (typeof TransactionPurpose)[keyof typeof TransactionPurpose]

export const RateMethod = {
  NOMINAL_DIV_12: 'NOMINAL_DIV_12',
  EFFECTIVE_TO_MONTHLY: 'EFFECTIVE_TO_MONTHLY',
  MONTHLY_DIRECT: 'MONTHLY_DIRECT',
} as const

export type RateMethod = (typeof RateMethod)[keyof typeof RateMethod]

export const MinimumPaymentRuleKind = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
  GREATER_OF: 'GREATER_OF',
  CUSTOM: 'CUSTOM',
} as const

export type MinimumPaymentRuleKind =
  (typeof MinimumPaymentRuleKind)[keyof typeof MinimumPaymentRuleKind]

export const Provenance = {
  REAL: 'REAL',
  ESTIMATED: 'ESTIMATED',
} as const

export type Provenance = (typeof Provenance)[keyof typeof Provenance]

export const ImportBatchStatus = {
  PREVIEW: 'PREVIEW',
  COMMITTED: 'COMMITTED',
  FAILED: 'FAILED',
  DUPLICATE: 'DUPLICATE',
} as const

export type ImportBatchStatus = (typeof ImportBatchStatus)[keyof typeof ImportBatchStatus]

export const InstallmentPlanStatus = {
  ACTIVE: 'ACTIVE',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const

export type InstallmentPlanStatus =
  (typeof InstallmentPlanStatus)[keyof typeof InstallmentPlanStatus]
