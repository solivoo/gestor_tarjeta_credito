import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type Sequelize,
} from 'sequelize'

export class PaymentModel extends Model<
  InferAttributes<PaymentModel>,
  InferCreationAttributes<PaymentModel>
> {
  declare id: CreationOptional<string>
  declare userId: string
  declare creditCardId: string
  declare date: string
  declare amount: string
  declare statementId: string | null
  declare source: string
  declare createdAt: CreationOptional<Date>
}

export function initPaymentModel(sequelize: Sequelize): typeof PaymentModel {
  PaymentModel.init(
    {
      id: { type: DataTypes.STRING(36), primaryKey: true },
      userId: { type: DataTypes.STRING(36), allowNull: false },
      creditCardId: { type: DataTypes.STRING(36), allowNull: false },
      date: { type: DataTypes.STRING, allowNull: false },
      amount: { type: DataTypes.STRING, allowNull: false },
      statementId: { type: DataTypes.STRING(36), allowNull: true },
      source: { type: DataTypes.STRING, allowNull: false },
      createdAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'payments',
      updatedAt: false,
    },
  )
  return PaymentModel
}
