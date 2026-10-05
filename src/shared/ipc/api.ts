export interface CreateStatementInput {
  creditCardId: string
  statementDate: string
  periodStart?: string | null
  periodEnd?: string | null
  previousBalance: string
  currentBalance: string
  deferredBalance?: string
  totalDebt: string
  minimumPayment: string
  totalPaymentDue: string
  availableCredit?: string | null
  creditLimit?: string | null
  interestCharged?: string
  feesCharged?: string
  insuranceCharged?: string
  taxesCharged?: string
  paymentsReceived?: string
  newPurchases?: string
  cashAdvances?: string
  provenanceNotes?: string | null
}

export interface CreatePaymentInput {
  creditCardId: string
  date: string
  amount: string
  statementId?: string | null
}
