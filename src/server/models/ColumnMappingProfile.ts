import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type Sequelize,
} from 'sequelize'

export class ColumnMappingProfileModel extends Model<
  InferAttributes<ColumnMappingProfileModel>,
  InferCreationAttributes<ColumnMappingProfileModel>
> {
  declare id: CreationOptional<string>
  declare userId: string | null
  declare issuer: string
  declare headerFingerprint: string
  declare mappingJson: string
  declare creditCardId: string | null
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

export function initColumnMappingProfileModel(
  sequelize: Sequelize,
): typeof ColumnMappingProfileModel {
  ColumnMappingProfileModel.init(
    {
      id: { type: DataTypes.STRING(36), primaryKey: true },
      userId: { type: DataTypes.STRING(36), allowNull: true },
      issuer: { type: DataTypes.STRING, allowNull: false },
      headerFingerprint: { type: DataTypes.STRING, allowNull: false },
      mappingJson: { type: DataTypes.TEXT, allowNull: false },
      creditCardId: { type: DataTypes.STRING(36), allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'column_mapping_profiles',
      indexes: [{ fields: ['userId', 'issuer', 'headerFingerprint'], unique: true }],
    },
  )
  return ColumnMappingProfileModel
}
