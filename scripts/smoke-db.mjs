import { Sequelize, DataTypes } from 'sequelize'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(tmpdir(), 'ccapp-'))
const storage = join(dir, 'test.sqlite')

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
})

const Card = sequelize.define(
  'credit_cards',
  {
    id: { type: DataTypes.STRING(36), primaryKey: true },
    name: DataTypes.STRING,
  },
  { timestamps: false },
)

await sequelize.sync()
await Card.create({ id: '1', name: 'Smoke' })
const rows = await Card.findAll()
console.log('sqlite ok', rows.map((r) => r.toJSON()))
await sequelize.close()
