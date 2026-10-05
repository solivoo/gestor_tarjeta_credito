import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { parseWorkbookFromPath } from '../../src/server/importers/parseWorkbook'
import { ProdubancoImporter } from '../../src/server/importers/ProdubancoImporter'

const SAMPLE = '/home/solivo/Descargas/ESTADO CUENTA TC_419560XXXXXX3502.xlsx'

describe('Produbanco workbook import', () => {
  it.skipIf(!existsSync(SAMPLE))('parses the official Produbanco statement format', () => {
    const workbook = parseWorkbookFromPath(SAMPLE)
    const importer = new ProdubancoImporter()

    expect(importer.canParse(workbook.headers, workbook.rows)).toBe(true)

    const draft = importer.parse(workbook)

    expect(draft.issuer).toBe('produbanco')
    expect(draft.needsManualMapping).toBe(false)
    expect(draft.headers).toEqual([
      'TARJETA',
      'FECHA',
      'NUMERO REFERENCIA',
      'DESCRIPCION',
      'FORMA PAGO',
      'VALOR DOLARES',
      'SALDO DIFERIDO',
    ])

    expect(draft.fields.find((f) => f.field === 'statementDate')?.value).toBe('2025-11-14')
    expect(draft.fields.find((f) => f.field === 'periodEnd')?.value).toBe('2025-12-01')
    expect(draft.fields.find((f) => f.field === 'minimumPayment')?.value).toBe('425.170000')
    expect(draft.fields.find((f) => f.field === 'totalPaymentDue')?.value).toBe('788.050000')
    expect(draft.fields.find((f) => f.field === 'currentBalance')?.value).toBe('864.150000')
    expect(draft.fields.find((f) => f.field === 'deferredBalance')?.value).toBe('2088.230000')
    expect(draft.fields.find((f) => f.field === 'previousBalance')?.value).toBe('615.340000')
    expect(draft.fields.find((f) => f.field === 'creditLimit')?.value).toBe('3180.980000')
    expect(draft.fields.find((f) => f.field === 'availableCredit')?.value).toBe('228.600000')
    expect(draft.fields.find((f) => f.field === 'interestCharged')?.value).toBe('0.000000')
    expect(draft.transactions.length).toBeGreaterThan(10)
  })
})
