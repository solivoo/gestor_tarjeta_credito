import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type Sequelize,
} from 'sequelize'

export class TransactionModel extends Model<
  InferAttributes<TransactionModel>,
  InferCreationAttributes<TransactionModel>
> {
  declare id: CreationOptional<string>
  declare userId: string
  declare statementId: string | null
  declare creditCardId: string
  declare date: string
  declare description: string
  declare originalDescription: string
  declare normalizedDescription: string
  declare amount: string
  declare type: string
  declare category: string | null
  declare installmentId: string | null
  declare currency: string
  declare source: string
  declare purpose: string
  declare fingerprint: string
  declare createdAt: CreationOptional<Date>
}

export function initTransactionModel(sequelize: Sequelize): typeof TransactionModel {
  TransactionModel.init(
    {
      id: { type: DataTypes.STRING(36), primaryKey: true },
      userId: { type: DataTypes.STRING(36), allowNull: false },
      statementId: { type: DataTypes.STRING(36), allowNull: true },
      creditCardId: { type: DataTypes.STRING(36), allowNull: false },
      date: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.STRING, allowNull: false },
      originalDescription: { type: DataTypes.STRING, allowNull: false },
      normalizedDescription: { type: DataTypes.STRING, allowNull: false },
      amount: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: true },
      installmentId: { type: DataTypes.STRING(36), allowNull: true },
      currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
      source: { type: DataTypes.STRING, allowNull: false },
      purpose: { type: DataTypes.STRING, allowNull: false, defaultValue: 'UNKNOWN' },
      fingerprint: { type: DataTypes.STRING, allowNull: false },
      createdAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'transactions',
      updatedAt: false,
      indexes: [
        { fields: ['creditCardId', 'date'] },
        { fields: ['fingerprint'] },
        { fields: ['statementId'] },
      ],
    },
  )
  return TransactionModel
}
