import { v4 as uuid } from 'uuid'
import { getSequelize } from '../db/sequelize'
import { transactionFingerprint, normalizeDescription } from '../../domain/normalization'
import { moneyString, d } from '../../domain/money'
import { ImportBatchStatus, TransactionSource, TransactionType } from '../../shared/types/enums'
import type {
  ImportCommitInput,
  ImportCommitResult,
  ImportPreviewResult,
  ParsedStatementDraft,
} from '../../shared/types/import'
import {
  GenericExcelImporter,
  ProdubancoImporter,
  parseWorkbookFromBuffer,
  type StatementImporter,
} from '../importers'
import { ColumnMappingProfileModel } from '../models'
import {
  ImportBatchRepository,
  PaymentRepository,
  StatementRepository,
  TransactionRepository,
} from '../repositories'

const draftStore = new Map<string, ParsedStatementDraft>()

function fieldValue(draft: ParsedStatementDraft, field: string): string | null {
  return draft.fields.find((f) => f.field === field)?.value ?? null
}

function moneyOrZero(value: string | null): string {
  if (!value) return moneyString(0)
  try {
    return moneyString(d(value))
  } catch {
    return moneyString(0)
  }
}

function sumPurchasesAndPayments(draft: ParsedStatementDraft): {
  purchases: string
  payments: string
} {
  let purchases = d(0)
  let payments = d(0)
  for (const txn of draft.transactions) {
    const amount = d(txn.amount)
    if (txn.type === TransactionType.PAYMENT || txn.type === TransactionType.REFUND) {
      payments = payments.plus(amount.abs())
    } else if (
      txn.type === TransactionType.PURCHASE ||
      txn.type === TransactionType.CASH_ADVANCE ||
      txn.type === TransactionType.INSTALLMENT ||
      txn.type === TransactionType.FEE ||
      txn.type === TransactionType.TAX ||
      txn.type === TransactionType.INSURANCE
    ) {
      if (amount.gt(0)) purchases = purchases.plus(amount)
    }
  }
  return { purchases: moneyString(purchases), payments: moneyString(payments) }
}

export class ImportService {
  private readonly importers: StatementImporter[] = [
    new ProdubancoImporter(),
    new GenericExcelImporter(),
  ]
  private readonly batches = new ImportBatchRepository()
  private readonly statements = new StatementRepository()
  private readonly transactions = new TransactionRepository()
  private readonly payments = new PaymentRepository()

  listBatches(userId: string, creditCardId?: string) {
    return this.batches.list(userId, creditCardId)
  }

  async deleteBatch(
    userId: string,
    importBatchId: string,
  ): Promise<{ deletedStatements: number }> {
    const batch = await this.batches.getById(importBatchId, userId)
    if (!batch) throw new Error('Lote de importación no encontrado')

    const sequelize = getSequelize()
    return sequelize.transaction(async () => {
      const statements = await this.statements.listByImportBatchId(importBatchId, userId)
      const statementIds = statements.map((s) => s.id)
      await this.payments.deleteByStatementIds(statementIds, userId)
      await this.transactions.deleteByStatementIds(statementIds, userId)
      await this.statements.deleteByIds(statementIds, userId)
      await this.batches.delete(importBatchId, userId)
      return { deletedStatements: statementIds.length }
    })
  }

  private pickImporter(headers: string[], rows: string[][]): StatementImporter {
    return (
      this.importers.find((importer) => importer.canParse(headers, rows)) ??
      this.importers[this.importers.length - 1]!
    )
  }

  async previewFromBuffer(
    userId: string,
    buffer: Buffer,
    filename: string,
    creditCardId?: string,
  ): Promise<ImportPreviewResult> {
    const workbook = parseWorkbookFromBuffer(buffer, filename)

    let columnMapping: Record<string, string> | undefined
    if (creditCardId) {
      const headerFingerprint = workbook.headers.join('|').toLowerCase()
      const profile = await ColumnMappingProfileModel.findOne({
        where: { headerFingerprint, userId },
      })
      if (profile) {
        columnMapping = JSON.parse(profile.mappingJson) as Record<string, string>
      }
    }

    const importer = this.pickImporter(workbook.headers, workbook.rows)
    const draft = importer.parse({
      filename: workbook.filename,
      fileHash: workbook.fileHash,
      headers: workbook.headers,
      rows: workbook.rows,
      columnMapping,
    })

    draftStore.set(draft.draftId, draft)

    const existing = await this.batches.findByHash(userId, draft.fileHash)
    let duplicateFingerprints = 0
    if (creditCardId) {
      const fingerprints = draft.transactions
        .filter((t) => t.date)
        .map((t) =>
          transactionFingerprint({
            date: t.date!,
            description: t.description,
            amount: t.amount,
            cardId: creditCardId,
          }),
        )
      const existingFp = await this.transactions.findFingerprints(userId, fingerprints)
      duplicateFingerprints = existingFp.size
    }

    const aggregates = sumPurchasesAndPayments(draft)
    const newPurchases = fieldValue(draft, 'newPurchases') ?? aggregates.purchases
    const paymentsReceived = fieldValue(draft, 'paymentsReceived') ?? aggregates.payments

    return {
      draft,
      summary: {
        statementDate: fieldValue(draft, 'statementDate'),
        currentBalance: fieldValue(draft, 'currentBalance'),
        deferredBalance: fieldValue(draft, 'deferredBalance'),
        minimumPayment: fieldValue(draft, 'minimumPayment'),
        totalPaymentDue: fieldValue(draft, 'totalPaymentDue'),
        interestCharged: fieldValue(draft, 'interestCharged'),
        newPurchases,
        paymentsReceived,
      },
      existingFileHash: Boolean(existing),
      duplicateFingerprints,
    }
  }

  async commit(userId: string, input: ImportCommitInput): Promise<ImportCommitResult> {
    const draft = draftStore.get(input.draftId)
    if (!draft) {
      throw new Error('Borrador de importación no encontrado o expirado')
    }

    if (input.columnMapping && Object.keys(input.columnMapping).length) {
      const headerFingerprint = draft.headers.join('|').toLowerCase()
      const existing = await ColumnMappingProfileModel.findOne({
        where: { headerFingerprint, userId },
      })
      const mappingJson = JSON.stringify(input.columnMapping)
      if (existing) {
        existing.mappingJson = mappingJson
        existing.creditCardId = input.creditCardId
        await existing.save()
      } else {
        await ColumnMappingProfileModel.create({
          id: uuid(),
          userId,
          issuer: draft.issuer ?? 'generic',
          headerFingerprint,
          mappingJson,
          creditCardId: input.creditCardId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    const existingBatch = await this.batches.findByHash(userId, draft.fileHash)
    if (existingBatch && !input.acceptDuplicates) {
      throw new Error(
        'Este archivo ya fue importado anteriormente (mismo fileHash). Confirma acceptDuplicates para continuar.',
      )
    }

    const sequelize = getSequelize()
    return sequelize.transaction(async () => {
      const batch = await this.batches.create({
        userId,
        filename: draft.filename,
        fileHash: existingBatch ? `${draft.fileHash}-${Date.now()}` : draft.fileHash,
        issuer: draft.issuer,
        statementPeriod: fieldValue(draft, 'statementDate'),
        status: ImportBatchStatus.COMMITTED,
        rowsRead: draft.transactions.length,
        rowsImported: 0,
        duplicatesIgnored: 0,
        creditCardId: input.creditCardId,
      })

      const currentBalance = moneyOrZero(fieldValue(draft, 'currentBalance'))
      const deferredBalance = moneyOrZero(fieldValue(draft, 'deferredBalance'))
      const totalDebt =
        fieldValue(draft, 'totalDebt') != null
          ? moneyOrZero(fieldValue(draft, 'totalDebt'))
          : moneyString(d(currentBalance).plus(d(deferredBalance)))

      const aggregates = sumPurchasesAndPayments(draft)
      const statement = await this.statements.create(userId, {
        creditCardId: input.creditCardId,
        importBatchId: batch.id,
        statementDate: fieldValue(draft, 'statementDate') ?? new Date().toISOString().slice(0, 10),
        periodStart: fieldValue(draft, 'periodStart'),
        periodEnd: fieldValue(draft, 'periodEnd'),
        previousBalance: moneyOrZero(fieldValue(draft, 'previousBalance')),
        currentBalance,
        deferredBalance,
        totalDebt,
        minimumPayment: moneyOrZero(fieldValue(draft, 'minimumPayment')),
        totalPaymentDue: moneyOrZero(
          fieldValue(draft, 'totalPaymentDue') ?? fieldValue(draft, 'minimumPayment'),
        ),
        availableCredit: fieldValue(draft, 'availableCredit'),
        creditLimit: fieldValue(draft, 'creditLimit'),
        interestCharged: moneyOrZero(fieldValue(draft, 'interestCharged')),
        feesCharged: moneyOrZero(fieldValue(draft, 'feesCharged')),
        insuranceCharged: moneyOrZero(fieldValue(draft, 'insuranceCharged')),
        taxesCharged: moneyOrZero(fieldValue(draft, 'taxesCharged')),
        paymentsReceived: moneyOrZero(
          fieldValue(draft, 'paymentsReceived') ?? aggregates.payments,
        ),
        newPurchases: moneyOrZero(fieldValue(draft, 'newPurchases') ?? aggregates.purchases),
        cashAdvances: moneyOrZero(fieldValue(draft, 'cashAdvances')),
        provenanceNotes:
          'Totales del banco (REAL). Compras/pagos pueden estimarse desde movimientos si el Excel no los trae.',
      })

      const fingerprints = draft.transactions
        .filter((t) => t.date)
        .map((t) =>
          transactionFingerprint({
            date: t.date!,
            description: t.description,
            amount: t.amount,
            cardId: input.creditCardId,
          }),
        )

      const existingFp = await this.transactions.findFingerprints(userId, fingerprints)
      let duplicatesIgnored = 0
      const toInsert = []

      for (const txn of draft.transactions) {
        if (!txn.date) continue
        const fp = transactionFingerprint({
          date: txn.date,
          description: txn.description,
          amount: txn.amount,
          cardId: input.creditCardId,
        })
        if (existingFp.has(fp) && !input.acceptDuplicates) {
          duplicatesIgnored += 1
          continue
        }
        toInsert.push({
          userId,
          statementId: statement.id,
          creditCardId: input.creditCardId,
          date: txn.date,
          description: txn.description,
          originalDescription: txn.originalDescription,
          normalizedDescription: normalizeDescription(txn.description),
          amount: txn.amount,
          type: txn.type,
          source: TransactionSource.IMPORT,
          fingerprint: fp,
        })
      }

      await this.transactions.createMany(toInsert)

      const paymentTxns = toInsert.filter((t) => t.type === TransactionType.PAYMENT)
      await this.payments.createMany(
        userId,
        paymentTxns.map((t) => ({
          creditCardId: input.creditCardId,
          date: t.date,
          amount: t.amount.replace(/^-/, ''),
          statementId: statement.id,
          source: TransactionSource.IMPORT,
        })),
      )

      await this.batches.updateStats(batch.id, {
        status: ImportBatchStatus.COMMITTED,
        rowsImported: toInsert.length,
        duplicatesIgnored,
        creditCardId: input.creditCardId,
      })

      draftStore.delete(input.draftId)

      return {
        importBatchId: batch.id,
        statementId: statement.id,
        rowsImported: toInsert.length,
        duplicatesIgnored,
      }
    })
  }
}
