import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type Sequelize,
} from 'sequelize'

export class CreditCardModel extends Model<
  InferAttributes<CreditCardModel>,
  InferCreationAttributes<CreditCardModel>
> {
  declare id: CreationOptional<string>
  declare userId: string
  declare name: string
  declare issuer: string
  declare maskedNumber: string | null
  declare creditLimit: string
  declare currency: string
  declare annualInterestRate: string | null
  declare monthlyInterestRate: string | null
  declare rateMethod: string
  declare minimumPaymentRuleJson: string
  declare cutoffDay: number
  declare paymentDueDay: number
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

export function initCreditCardModel(sequelize: Sequelize): typeof CreditCardModel {
  CreditCardModel.init(
    {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
      },
      userId: { type: DataTypes.STRING(36), allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      issuer: { type: DataTypes.STRING, allowNull: false },
      maskedNumber: { type: DataTypes.STRING, allowNull: true },
      creditLimit: { type: DataTypes.STRING, allowNull: false },
      currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
      annualInterestRate: { type: DataTypes.STRING, allowNull: true },
      monthlyInterestRate: { type: DataTypes.STRING, allowNull: true },
      rateMethod: { type: DataTypes.STRING, allowNull: false },
      minimumPaymentRuleJson: { type: DataTypes.TEXT, allowNull: false },
      cutoffDay: { type: DataTypes.INTEGER, allowNull: false },
      paymentDueDay: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'credit_cards',
    },
  )
  return CreditCardModel
}
