import type {
  CreditCard,
  ImportBatch,
  MinimumPaymentRule,
  Payment,
  Statement,
  Transaction,
} from '../../shared/types/entities'
import type { RateMethod } from '../../shared/types/enums'
import type { CreditCardModel } from '../models/CreditCard'
import type { ImportBatchModel } from '../models/ImportBatch'
import type { PaymentModel } from '../models/Payment'
import type { StatementModel } from '../models/Statement'
import type { TransactionModel } from '../models/Transaction'

export function mapCreditCard(row: CreditCardModel): CreditCard {
  return {
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    maskedNumber: row.maskedNumber,
    creditLimit: row.creditLimit,
    currency: row.currency,
    annualInterestRate: row.annualInterestRate,
    monthlyInterestRate: row.monthlyInterestRate,
    rateMethod: row.rateMethod as RateMethod,
    minimumPaymentRule: JSON.parse(row.minimumPaymentRuleJson) as MinimumPaymentRule,
    cutoffDay: row.cutoffDay,
    paymentDueDay: row.paymentDueDay,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapStatement(row: StatementModel): Statement {
  return {
    id: row.id,
    creditCardId: row.creditCardId,
    importBatchId: row.importBatchId,
    statementDate: row.statementDate,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    previousBalance: row.previousBalance,
    currentBalance: row.currentBalance,
    deferredBalance: row.deferredBalance,
    totalDebt: row.totalDebt,
    minimumPayment: row.minimumPayment,
    totalPaymentDue: row.totalPaymentDue,
    availableCredit: row.availableCredit,
    creditLimit: row.creditLimit,
    interestCharged: row.interestCharged,
    feesCharged: row.feesCharged,
    insuranceCharged: row.insuranceCharged,
    taxesCharged: row.taxesCharged,
    paymentsReceived: row.paymentsReceived,
    newPurchases: row.newPurchases,
    cashAdvances: row.cashAdvances,
    provenanceNotes: row.provenanceNotes,
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapTransaction(row: TransactionModel): Transaction {
  return {
    id: row.id,
    statementId: row.statementId,
    creditCardId: row.creditCardId,
    date: row.date,
    description: row.description,
    originalDescription: row.originalDescription,
    normalizedDescription: row.normalizedDescription,
    amount: row.amount,
    type: row.type as Transaction['type'],
    category: row.category,
    installmentId: row.installmentId,
    currency: row.currency,
    source: row.source as Transaction['source'],
    purpose: row.purpose as Transaction['purpose'],
    fingerprint: row.fingerprint,
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapPayment(row: PaymentModel): Payment {
  return {
    id: row.id,
    creditCardId: row.creditCardId,
    date: row.date,
    amount: row.amount,
    statementId: row.statementId,
    source: row.source as Payment['source'],
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapImportBatch(row: ImportBatchModel): ImportBatch {
  return {
    id: row.id,
    filename: row.filename,
    fileHash: row.fileHash,
    importDate: row.importDate,
    issuer: row.issuer,
    statementPeriod: row.statementPeriod,
    status: row.status as ImportBatch['status'],
    rowsRead: row.rowsRead,
    rowsImported: row.rowsImported,
    duplicatesIgnored: row.duplicatesIgnored,
    creditCardId: row.creditCardId,
  }
}
