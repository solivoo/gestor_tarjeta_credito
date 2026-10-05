import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type Sequelize,
} from 'sequelize'

export class StatementModel extends Model<
  InferAttributes<StatementModel>,
  InferCreationAttributes<StatementModel>
> {
  declare id: CreationOptional<string>
  declare userId: string
  declare creditCardId: string
  declare importBatchId: string | null
  declare statementDate: string
  declare periodStart: string | null
  declare periodEnd: string | null
  declare previousBalance: string
  declare currentBalance: string
  declare deferredBalance: string
  declare totalDebt: string
  declare minimumPayment: string
  declare totalPaymentDue: string
  declare availableCredit: string | null
  declare creditLimit: string | null
  declare interestCharged: string
  declare feesCharged: string
  declare insuranceCharged: string
  declare taxesCharged: string
  declare paymentsReceived: string
  declare newPurchases: string
  declare cashAdvances: string
  declare provenanceNotes: string | null
  declare createdAt: CreationOptional<Date>
}

export function initStatementModel(sequelize: Sequelize): typeof StatementModel {
  StatementModel.init(
    {
      id: { type: DataTypes.STRING(36), primaryKey: true },
      userId: { type: DataTypes.STRING(36), allowNull: false },
      creditCardId: { type: DataTypes.STRING(36), allowNull: false },
      importBatchId: { type: DataTypes.STRING(36), allowNull: true },
      statementDate: { type: DataTypes.STRING, allowNull: false },
      periodStart: { type: DataTypes.STRING, allowNull: true },
      periodEnd: { type: DataTypes.STRING, allowNull: true },
      previousBalance: { type: DataTypes.STRING, allowNull: false, defaultValue: '0' },
      currentBalance: { type: DataTypes.STRING, allowNull: false },
      deferredBalance: { type: DataTypes.STRING, allowNull: false, defaultValue: '0' },
      totalDebt: { type: DataTypes.STRING, allowNull: false },
      minimumPayment: { type: DataTypes.STRING, allowNull: false },
      totalPaymentDue: { type: DataTypes.STRING, allowNull: false },
      availableCredit: { type: DataTypes.STRING, allowNull: true },
      creditLimit: { type: DataTypes.STRING, allowNull: true },
      interestCharged: { type: DataTypes.STRING, allowNull: false, defaultValue: '0' },
      feesCharged: { type: DataTypes.STRING, allowNull: false, defaultValue: '0' },
      insuranceCharged: { type: DataTypes.STRING, allowNull: false, defaultValue: '0' },
      taxesCharged: { type: DataTypes.STRING, allowNull: false, defaultValue: '0' },
      paymentsReceived: { type: DataTypes.STRING, allowNull: false, defaultValue: '0' },
      newPurchases: { type: DataTypes.STRING, allowNull: false, defaultValue: '0' },
      cashAdvances: { type: DataTypes.STRING, allowNull: false, defaultValue: '0' },
      provenanceNotes: { type: DataTypes.TEXT, allowNull: true },
      createdAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'statements',
      updatedAt: false,
      indexes: [{ fields: ['creditCardId', 'statementDate'] }],
    },
  )
  return StatementModel
}
