import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type Sequelize,
} from 'sequelize'

export class InstallmentPlanModel extends Model<
  InferAttributes<InstallmentPlanModel>,
  InferCreationAttributes<InstallmentPlanModel>
> {
  declare id: CreationOptional<string>
  declare userId: string
  declare creditCardId: string
  declare description: string
  declare originalAmount: string
  declare principalRemaining: string
  declare interestRate: string | null
  declare numberOfInstallments: number
  declare installmentsPaid: number
  declare installmentsRemaining: number
  declare installmentAmount: string
  declare startDate: string | null
  declare endDate: string | null
  declare totalFinancingCost: string | null
  declare sourceTransactionId: string | null
  declare status: string
  declare createdAt: CreationOptional<Date>
}

export function initInstallmentPlanModel(sequelize: Sequelize): typeof InstallmentPlanModel {
  InstallmentPlanModel.init(
    {
      id: { type: DataTypes.STRING(36), primaryKey: true },
      userId: { type: DataTypes.STRING(36), allowNull: false },
      creditCardId: { type: DataTypes.STRING(36), allowNull: false },
      description: { type: DataTypes.STRING, allowNull: false },
      originalAmount: { type: DataTypes.STRING, allowNull: false },
      principalRemaining: { type: DataTypes.STRING, allowNull: false },
      interestRate: { type: DataTypes.STRING, allowNull: true },
      numberOfInstallments: { type: DataTypes.INTEGER, allowNull: false },
      installmentsPaid: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      installmentsRemaining: { type: DataTypes.INTEGER, allowNull: false },
      installmentAmount: { type: DataTypes.STRING, allowNull: false },
      startDate: { type: DataTypes.STRING, allowNull: true },
      endDate: { type: DataTypes.STRING, allowNull: true },
      totalFinancingCost: { type: DataTypes.STRING, allowNull: true },
      sourceTransactionId: { type: DataTypes.STRING(36), allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'ACTIVE' },
      createdAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'installment_plans',
      updatedAt: false,
    },
  )
  return InstallmentPlanModel
}
