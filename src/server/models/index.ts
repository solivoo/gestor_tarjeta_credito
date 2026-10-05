import type { Sequelize } from 'sequelize'
import { initUserModel, UserModel } from './User'
import { initCreditCardModel, CreditCardModel } from './CreditCard'
import { initStatementModel, StatementModel } from './Statement'
import { initTransactionModel, TransactionModel } from './Transaction'
import { initPaymentModel, PaymentModel } from './Payment'
import { initImportBatchModel, ImportBatchModel } from './ImportBatch'
import { initInstallmentPlanModel, InstallmentPlanModel } from './InstallmentPlan'
import {
  initColumnMappingProfileModel,
  ColumnMappingProfileModel,
} from './ColumnMappingProfile'

export function initModels(sequelize: Sequelize): void {
  initUserModel(sequelize)
  initCreditCardModel(sequelize)
  initStatementModel(sequelize)
  initTransactionModel(sequelize)
  initPaymentModel(sequelize)
  initImportBatchModel(sequelize)
  initInstallmentPlanModel(sequelize)
  initColumnMappingProfileModel(sequelize)

  UserModel.hasMany(CreditCardModel, { foreignKey: 'userId', as: 'creditCards' })
  CreditCardModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' })

  CreditCardModel.hasMany(StatementModel, { foreignKey: 'creditCardId', as: 'statements' })
  StatementModel.belongsTo(CreditCardModel, { foreignKey: 'creditCardId', as: 'creditCard' })

  CreditCardModel.hasMany(TransactionModel, { foreignKey: 'creditCardId', as: 'transactions' })
  TransactionModel.belongsTo(CreditCardModel, { foreignKey: 'creditCardId', as: 'creditCard' })

  StatementModel.hasMany(TransactionModel, { foreignKey: 'statementId', as: 'transactions' })
  TransactionModel.belongsTo(StatementModel, { foreignKey: 'statementId', as: 'statement' })

  CreditCardModel.hasMany(PaymentModel, { foreignKey: 'creditCardId', as: 'payments' })
  PaymentModel.belongsTo(CreditCardModel, { foreignKey: 'creditCardId', as: 'creditCard' })

  StatementModel.hasMany(PaymentModel, { foreignKey: 'statementId', as: 'payments' })
  PaymentModel.belongsTo(StatementModel, { foreignKey: 'statementId', as: 'statement' })

  CreditCardModel.hasMany(ImportBatchModel, { foreignKey: 'creditCardId', as: 'importBatches' })
  ImportBatchModel.belongsTo(CreditCardModel, { foreignKey: 'creditCardId', as: 'creditCard' })

  ImportBatchModel.hasMany(StatementModel, { foreignKey: 'importBatchId', as: 'statements' })
  StatementModel.belongsTo(ImportBatchModel, { foreignKey: 'importBatchId', as: 'importBatch' })

  CreditCardModel.hasMany(InstallmentPlanModel, {
    foreignKey: 'creditCardId',
    as: 'installmentPlans',
  })
  InstallmentPlanModel.belongsTo(CreditCardModel, {
    foreignKey: 'creditCardId',
    as: 'creditCard',
  })
}

export {
  UserModel,
  CreditCardModel,
  StatementModel,
  TransactionModel,
  PaymentModel,
  ImportBatchModel,
  InstallmentPlanModel,
  ColumnMappingProfileModel,
}
