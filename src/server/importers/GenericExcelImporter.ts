import { v4 as uuid } from 'uuid'
import { moneyString, d } from '../../domain/money'
import { classifyTransactionType } from '../../domain/normalization'
import type { ImportFieldKey, ParsedStatementDraft } from '../../shared/types/import'
import type { StatementImporter } from './StatementImporter'

const HEADER_ALIASES: Record<ImportFieldKey, string[]> = {
  date: ['fecha', 'date', 'f. movimiento', 'fecha movimiento'],
  description: ['descripcion', 'descripción', 'description', 'detalle', 'concepto'],
  amount: ['valor dolares', 'valor dólares', 'monto', 'amount', 'valor', 'importe'],
  type: ['forma pago', 'tipo', 'type', 'categoria', 'categoría'],
  statementDate: ['fecha de corte', 'fecha corte', 'statement date'],
  periodStart: ['periodo desde', 'period start', 'desde'],
  periodEnd: ['periodo hasta', 'period end', 'hasta', 'fecha maxima de pago', 'fecha máxima de pago'],
  previousBalance: ['saldo anterior', 'previous balance'],
  currentBalance: ['saldo actual', 'saldo corriente', 'current balance'],
  deferredBalance: ['saldo diferido', 'deferred balance'],
  totalDebt: ['deuda total', 'total debt', 'saldo total'],
  minimumPayment: ['pago minimo', 'pago mínimo', 'minimum payment', 'pago minimo a realizar'],
  totalPaymentDue: ['pago total', 'total payment', 'pago de contado'],
  availableCredit: ['cupo disponible', 'available credit'],
  creditLimit: ['cupo total', 'credit limit', 'limite de credito', 'límite de crédito', 'cupo'],
  interestCharged: [
    'interes financiamiento',
    'interés financiamiento',
    'interes de financiamiento',
    'interés de financiamiento',
    'interes',
    'interés',
    'intereses',
  ],
  feesCharged: ['tarifas', 'cargos financieros', 'fees', 'comisiones'],
  insuranceCharged: ['seguros', 'insurance'],
  taxesCharged: ['impuestos', 'iva', 'taxes'],
  paymentsReceived: ['pagos recibidos', 'payments', 'abonos'],
  newPurchases: ['compras', 'purchases', 'consumos'],
  cashAdvances: ['avances', 'cash advances', 'avance'],
}

function normHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function detectColumnMap(headers: string[]): Partial<Record<ImportFieldKey, number>> {
  const map: Partial<Record<ImportFieldKey, number>> = {}
  const normalized = headers.map(normHeader)

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
    [ImportFieldKey, string[]]
  >) {
    const idx = normalized.findIndex((h) => aliases.some((a) => h.includes(normHeader(a))))
    if (idx >= 0) map[field] = idx
  }
  return map
}

function parseMoneyCell(raw: string | undefined): string | null {
  if (raw == null || raw.trim() === '') return null
  const cleaned = raw
    .replace(/[^\d,.\-]/g, '')
    .replace(/,(?=\d{2}$)/, '.')
    .replace(/,/g, '')
  if (!cleaned || cleaned === '-' || cleaned === '.') return null
  try {
    return moneyString(d(cleaned))
  } catch {
    return null
  }
}

function parseDateCell(raw: string | undefined): string | null {
  if (!raw?.trim()) return null
  const value = raw.trim()
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
  if (dmy) {
    const day = dmy[1].padStart(2, '0')
    const month = dmy[2].padStart(2, '0')
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]
    return `${year}-${month}-${day}`
  }
  return null
}

export class GenericExcelImporter implements StatementImporter {
  readonly name = 'generic'

  canParse(_headers: string[], _sampleRows: string[][]): boolean {
    return true
  }

  parse(params: {
    filename: string
    fileHash: string
    headers: string[]
    rows: string[][]
    columnMapping?: Record<string, string>
  }): ParsedStatementDraft {
    // Solo mapear columnas de movimientos; los totales vienen de pares etiqueta/valor.
    const txnFields: ImportFieldKey[] = ['date', 'description', 'amount', 'type']
    const autoMap = detectColumnMap(params.headers)
    const mapping: Partial<Record<ImportFieldKey, number>> = {}
    for (const field of txnFields) {
      if (autoMap[field] != null) mapping[field] = autoMap[field]
    }

    if (params.columnMapping) {
      for (const [headerOrIndex, field] of Object.entries(params.columnMapping)) {
        const idx = Number.isInteger(Number(headerOrIndex))
          ? Number(headerOrIndex)
          : params.headers.findIndex((h) => normHeader(h) === normHeader(headerOrIndex))
        if (idx >= 0) mapping[field as ImportFieldKey] = idx
      }
    }

    const summaryFields: ImportFieldKey[] = [
      'statementDate',
      'previousBalance',
      'currentBalance',
      'deferredBalance',
      'totalDebt',
      'minimumPayment',
      'totalPaymentDue',
      'availableCredit',
      'creditLimit',
      'interestCharged',
      'feesCharged',
      'insuranceCharged',
      'taxesCharged',
      'paymentsReceived',
      'newPurchases',
      'cashAdvances',
      'periodEnd',
    ]

    const fields = summaryFields.map((field) => ({
      field,
      value: null as string | null,
      confidence: 0,
    }))

    // Escanear pares etiqueta/valor (formato Produbanco: "SALDO ACTUAL:" | "1179.05").
    // Preferir el alias más largo para evitar colisiones.
    for (const row of params.rows) {
      if (row.length < 2) continue
      const label = normHeader((row[0] ?? '').replace(/:$/, ''))
      if (!label || parseDateCell(row[0])) continue

      let best: { field: ImportFieldKey; aliasLen: number } | null = null
      for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
        [ImportFieldKey, string[]]
      >) {
        if (txnFields.includes(field)) continue
        for (const alias of aliases) {
          const normalizedAlias = normHeader(alias)
          if (label !== normalizedAlias && !label.startsWith(normalizedAlias)) continue
          if (!best || normalizedAlias.length > best.aliasLen) {
            best = { field, aliasLen: normalizedAlias.length }
          }
        }
      }
      if (!best) continue
      const existing = fields.find((f) => f.field === best.field)
      if (!existing || existing.confidence >= 0.85) continue
      const raw = row[1]
      const parsed =
        best.field.includes('Date') || best.field.startsWith('period')
          ? parseDateCell(raw)
          : parseMoneyCell(raw)
      if (parsed) {
        existing.value = parsed
        existing.confidence = 0.9
      }
    }

    // Si no hay deuda total, estimar como corriente + diferido (marcado con menor confianza).
    const current = fields.find((f) => f.field === 'currentBalance')
    const deferred = fields.find((f) => f.field === 'deferredBalance')
    const total = fields.find((f) => f.field === 'totalDebt')
    if (total && !total.value && current?.value && deferred?.value) {
      try {
        total.value = moneyString(d(current.value).plus(d(deferred.value)))
        total.confidence = 0.6
      } catch {
        // ignore
      }
    }

    const dateCol = mapping.date
    const descCol = mapping.description
    const amountCol = mapping.amount

    const transactions = []
    const warnings: string[] = []

    if (dateCol == null || descCol == null || amountCol == null) {
      warnings.push(
        'No se identificaron con certeza las columnas de fecha, descripción o monto. Se requiere mapeo manual.',
      )
    } else {
      for (const row of params.rows) {
        const date = parseDateCell(row[dateCol])
        const description = (row[descCol] ?? '').trim()
        const amount = parseMoneyCell(row[amountCol])
        if (!date || !description || amount == null) continue
        if (normHeader(description) === 'descripcion' || normHeader(description) === 'detalle') {
          continue
        }
        const classified = classifyTransactionType(description)
        transactions.push({
          date,
          description,
          originalDescription: description,
          amount,
          type: classified.type,
          typeConfidence: classified.confidence,
        })
      }
    }

    const criticalMissing = ['currentBalance', 'minimumPayment'].filter((field) => {
      const f = fields.find((x) => x.field === field)
      return !f?.value || f.confidence < 0.5
    })

    if (criticalMissing.length) {
      warnings.push(`Campos críticos con baja confianza: ${criticalMissing.join(', ')}.`)
    }
    if (total?.confidence === 0.6) {
      warnings.push(
        'Deuda total estimada como saldo actual + saldo diferido (no venía explícita en el Excel).',
      )
    }

    const issuerGuess = /produbanco|olivo|tarjeta no/i.test(params.filename)
      ? 'produbanco'
      : params.rows.some((r) => /pago minimo|saldo diferido|fecha de corte/i.test(r[0] ?? ''))
        ? 'produbanco'
        : 'generic'

    const needsManualMapping =
      dateCol == null ||
      descCol == null ||
      amountCol == null ||
      criticalMissing.length > 0

    return {
      draftId: uuid(),
      filename: params.filename,
      fileHash: params.fileHash,
      issuer: issuerGuess,
      fields,
      transactions,
      warnings,
      needsManualMapping,
      headers: params.headers,
      sampleRows: params.rows.slice(0, 8),
    }
  }
}
