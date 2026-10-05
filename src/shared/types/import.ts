import type { MoneyString } from './money'
import type { TransactionType } from './enums'

export type ImportFieldKey =
  | 'date'
  | 'description'
  | 'amount'
  | 'type'
  | 'statementDate'
  | 'periodStart'
  | 'periodEnd'
  | 'previousBalance'
  | 'currentBalance'
  | 'deferredBalance'
  | 'totalDebt'
  | 'minimumPayment'
  | 'totalPaymentDue'
  | 'availableCredit'
  | 'creditLimit'
  | 'interestCharged'
  | 'feesCharged'
  | 'insuranceCharged'
  | 'taxesCharged'
  | 'paymentsReceived'
  | 'newPurchases'
  | 'cashAdvances'

export interface FieldConfidence {
  field: ImportFieldKey
  value: string | null
  confidence: number
}

export interface ParsedTransactionDraft {
  date: string | null
  description: string
  originalDescription: string
  amount: MoneyString
  type: TransactionType
  typeConfidence: number
}

export interface ParsedStatementDraft {
  draftId: string
  filename: string
  fileHash: string
  issuer: string | null
  fields: FieldConfidence[]
  transactions: ParsedTransactionDraft[]
  warnings: string[]
  needsManualMapping: boolean
  headers: string[]
  sampleRows: string[][]
}

export interface ImportPreviewResult {
  draft: ParsedStatementDraft
  summary: {
    statementDate: string | null
    currentBalance: MoneyString | null
    deferredBalance: MoneyString | null
    minimumPayment: MoneyString | null
    totalPaymentDue: MoneyString | null
    interestCharged: MoneyString | null
    newPurchases: MoneyString | null
    paymentsReceived: MoneyString | null
  }
  existingFileHash: boolean
  duplicateFingerprints: number
}

export interface ImportCommitInput {
  draftId: string
  creditCardId: string
  columnMapping?: Record<string, ImportFieldKey>
  acceptDuplicates?: boolean
}

export interface ImportCommitResult {
  importBatchId: string
  statementId: string
  rowsImported: number
  duplicatesIgnored: number
}
