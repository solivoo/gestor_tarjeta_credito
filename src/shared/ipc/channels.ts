export const IpcChannels = {
  cardsList: 'cards:list',
  cardsGet: 'cards:get',
  cardsCreate: 'cards:create',
  cardsUpdate: 'cards:update',
  cardsDelete: 'cards:delete',

  statementsList: 'statements:list',
  statementsGet: 'statements:get',
  statementsCreate: 'statements:create',

  transactionsList: 'transactions:list',

  paymentsList: 'payments:list',
  paymentsCreate: 'payments:create',

  importBatchesList: 'importBatches:list',
  importBatchesDelete: 'importBatches:delete',
  importPreview: 'import:preview',
  importCommit: 'import:commit',

  simulateDebt: 'simulate:debt',
  simulateCompare: 'simulate:compare',
  simulatePurchaseImpact: 'simulate:purchaseImpact',

  dialogOpenExcel: 'dialog:openExcel',
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]
