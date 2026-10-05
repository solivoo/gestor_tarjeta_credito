import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type Sequelize,
} from 'sequelize'

export class ImportBatchModel extends Model<
  InferAttributes<ImportBatchModel>,
  InferCreationAttributes<ImportBatchModel>
> {
  declare id: CreationOptional<string>
  declare userId: string
  declare filename: string
  declare fileHash: string
  declare importDate: string
  declare issuer: string | null
  declare statementPeriod: string | null
  declare status: string
  declare rowsRead: number
  declare rowsImported: number
  declare duplicatesIgnored: number
  declare creditCardId: string | null
}

export function initImportBatchModel(sequelize: Sequelize): typeof ImportBatchModel {
  ImportBatchModel.init(
    {
      id: { type: DataTypes.STRING(36), primaryKey: true },
      userId: { type: DataTypes.STRING(36), allowNull: false },
      filename: { type: DataTypes.STRING, allowNull: false },
      fileHash: { type: DataTypes.STRING, allowNull: false },
      importDate: { type: DataTypes.STRING, allowNull: false },
      issuer: { type: DataTypes.STRING, allowNull: true },
      statementPeriod: { type: DataTypes.STRING, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false },
      rowsRead: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      rowsImported: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      duplicatesIgnored: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      creditCardId: { type: DataTypes.STRING(36), allowNull: true },
    },
    {
      sequelize,
      tableName: 'import_batches',
      timestamps: false,
      indexes: [{ fields: ['userId', 'fileHash'], unique: true }],
    },
  )
  return ImportBatchModel
}
