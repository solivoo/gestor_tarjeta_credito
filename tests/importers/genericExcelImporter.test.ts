import { describe, expect, it } from 'vitest'
import { GenericExcelImporter } from '../../src/server/importers/GenericExcelImporter'

describe('GenericExcelImporter', () => {
  it('detects summary labels and transaction columns', () => {
    const importer = new GenericExcelImporter()
    const headers = ['Fecha', 'Descripción', 'Monto']
    const rows = [
      ['Fecha de corte', '2026-01-15'],
      ['Saldo actual', '2549.00'],
      ['Saldo diferido', '865.00'],
      ['Pago mínimo', '130.00'],
      ['Pago total', '2549.00'],
      ['Interés financiamiento', '14.46'],
      ['Compras', '320.00'],
      ['Pagos', '200.00'],
      ['Fecha', 'Descripción', 'Monto'],
      ['2026-01-03', 'SUPERMERCADO XYZ', '45.90'],
      ['2026-01-05', 'INTERES FINANCIAMIENTO', '14.46'],
      ['2026-01-10', 'PAGO TARJETA', '-200.00'],
    ]

    const draft = importer.parse({
      filename: 'estado.xlsx',
      fileHash: 'abc',
      headers,
      rows,
    })

    expect(draft.fields.find((f) => f.field === 'currentBalance')?.value).toBe('2549.000000')
    expect(draft.fields.find((f) => f.field === 'minimumPayment')?.value).toBe('130.000000')
    expect(draft.fields.find((f) => f.field === 'interestCharged')?.value).toBe('14.460000')
    expect(draft.transactions.length).toBeGreaterThanOrEqual(3)
    expect(draft.transactions.some((t) => t.type === 'INTEREST')).toBe(true)
    expect(draft.transactions.some((t) => t.type === 'PAYMENT')).toBe(true)
  })
})
