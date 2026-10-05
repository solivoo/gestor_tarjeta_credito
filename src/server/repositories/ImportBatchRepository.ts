import { v4 as uuid } from 'uuid'
import type { ImportBatch } from '../../shared/types/entities'
import type { ImportBatchStatus } from '../../shared/types/enums'
import { ImportBatchModel } from '../models'
import { mapImportBatch } from './mappers'

export class ImportBatchRepository {
  async list(userId: string, creditCardId?: string): Promise<ImportBatch[]> {
    const where: Record<string, string> = { userId }
    if (creditCardId) where.creditCardId = creditCardId
    const rows = await ImportBatchModel.findAll({
      where,
      order: [['importDate', 'DESC']],
    })
    return rows.map(mapImportBatch)
  }

  async findByHash(userId: string, fileHash: string): Promise<ImportBatch | null> {
    const row = await ImportBatchModel.findOne({ where: { userId, fileHash } })
    return row ? mapImportBatch(row) : null
  }

  async getById(id: string, userId: string): Promise<ImportBatch | null> {
    const row = await ImportBatchModel.findOne({ where: { id, userId } })
    return row ? mapImportBatch(row) : null
  }

  async delete(id: string, userId: string): Promise<void> {
    await ImportBatchModel.destroy({ where: { id, userId } })
  }

  async create(input: {
    userId: string
    filename: string
    fileHash: string
    issuer: string | null
    statementPeriod: string | null
    status: ImportBatchStatus
    rowsRead: number
    rowsImported: number
    duplicatesIgnored: number
    creditCardId: string | null
  }): Promise<ImportBatch> {
    const row = await ImportBatchModel.create({
      id: uuid(),
      userId: input.userId,
      filename: input.filename,
      fileHash: input.fileHash,
      importDate: new Date().toISOString(),
      issuer: input.issuer,
      statementPeriod: input.statementPeriod,
      status: input.status,
      rowsRead: input.rowsRead,
      rowsImported: input.rowsImported,
      duplicatesIgnored: input.duplicatesIgnored,
      creditCardId: input.creditCardId,
    })
    return mapImportBatch(row)
  }

  async updateStats(
    id: string,
    stats: {
      status: ImportBatchStatus
      rowsImported: number
      duplicatesIgnored: number
      creditCardId?: string
    },
  ): Promise<void> {
    await ImportBatchModel.update(
      {
        status: stats.status,
        rowsImported: stats.rowsImported,
        duplicatesIgnored: stats.duplicatesIgnored,
        creditCardId: stats.creditCardId,
      },
      { where: { id } },
    )
  }
}
