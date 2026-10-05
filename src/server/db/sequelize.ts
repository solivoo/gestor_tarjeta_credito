import { Sequelize } from 'sequelize'
import { initModels } from '../models'

let sequelize: Sequelize | null = null

export function getSequelize(): Sequelize {
  if (!sequelize) {
    throw new Error('Sequelize no inicializado')
  }
  return sequelize
}

export async function initDatabase(): Promise<Sequelize> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL es requerido')
  }

  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
  })

  initModels(sequelize)
  await sequelize.sync()
  return sequelize
}
