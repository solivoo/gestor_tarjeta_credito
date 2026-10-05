import type {
  ImportBatchStatus,
  InstallmentPlanStatus,
  MinimumPaymentRuleKind,
  RateMethod,
  TransactionPurpose,
  TransactionSource,
  TransactionType,
} from './enums'
import type { MoneyString } from './money'

export interface MinimumPaymentRule {
  kind: MinimumPaymentRuleKind
  percentage?: MoneyString
  fixedAmount?: MoneyString
}

export interface CreditCard {
  id: string
  name: string
  issuer: string
  maskedNumber: string | null
  creditLimit: MoneyString
  currency: string
  annualInterestRate: MoneyString | null
  monthlyInterestRate: MoneyString | null
  rateMethod: RateMethod
  minimumPaymentRule: MinimumPaymentRule
  cutoffDay: number
  paymentDueDay: number
  createdAt: string
  updatedAt: string
}

export interface Statement {
  id: string
  creditCardId: string
  importBatchId: string | null
  statementDate: string
  periodStart: string | null
  periodEnd: string | null
  previousBalance: MoneyString
  currentBalance: MoneyString
  deferredBalance: MoneyString
  totalDebt: MoneyString
  minimumPayment: MoneyString
  totalPaymentDue: MoneyString
  availableCredit: MoneyString | null
  creditLimit: MoneyString | null
  interestCharged: MoneyString
  feesCharged: MoneyString
  insuranceCharged: MoneyString
  taxesCharged: MoneyString
  paymentsReceived: MoneyString
  newPurchases: MoneyString
  cashAdvances: MoneyString
  provenanceNotes: string | null
  createdAt: string
}

export interface Transaction {
  id: string
  statementId: string | null
  creditCardId: string
  date: string
  description: string
  originalDescription: string
  normalizedDescription: string
  amount: MoneyString
  type: TransactionType
  category: string | null
  installmentId: string | null
  currency: string
  source: TransactionSource
  purpose: TransactionPurpose
  fingerprint: string
  createdAt: string
}

export interface InstallmentPlan {
  id: string
  creditCardId: string
  description: string
  originalAmount: MoneyString
  principalRemaining: MoneyString
  interestRate: MoneyString | null
  numberOfInstallments: number
  installmentsPaid: number
  installmentsRemaining: number
  installmentAmount: MoneyString
  startDate: string | null
  endDate: string | null
  totalFinancingCost: MoneyString | null
  sourceTransactionId: string | null
  status: InstallmentPlanStatus
  createdAt: string
}

export interface Payment {
  id: string
  creditCardId: string
  date: string
  amount: MoneyString
  statementId: string | null
  source: TransactionSource
  createdAt: string
}

export interface ImportBatch {
  id: string
  filename: string
  fileHash: string
  importDate: string
  issuer: string | null
  statementPeriod: string | null
  status: ImportBatchStatus
  rowsRead: number
  rowsImported: number
  duplicatesIgnored: number
  creditCardId: string | null
}

export interface ColumnMappingProfile {
  id: string
  issuer: string
  headerFingerprint: string
  mappingJson: Record<string, string>
  creditCardId: string | null
  createdAt: string
  updatedAt: string
}

export interface NormalizationRule {
  id: string
  pattern: string
  transactionType: TransactionType
  priority: number
  createdAt: string
}
