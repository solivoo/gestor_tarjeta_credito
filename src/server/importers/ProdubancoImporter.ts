import type { ParsedStatementDraft } from '../../shared/types/import'
import { GenericExcelImporter } from './GenericExcelImporter'
import type { StatementImporter } from './StatementImporter'

/**
 * Formato observado en estados Produbanco (.xlsx):
 * - Resumen etiqueta/valor: FECHA DE CORTE, PAGO MINIMO, SALDO ACTUAL, SALDO DIFERIDO, CUPO...
 * - Tabla: TARJETA | FECHA | NUMERO REFERENCIA | DESCRIPCION | FORMA PAGO | VALOR DOLARES | SALDO DIFERIDO
 * - !ref a veces viene malformado ("1:G68"); lo normaliza parseWorkbook.
 */
export class ProdubancoImporter implements StatementImporter {
  readonly name = 'produbanco'
  private readonly generic = new GenericExcelImporter()

  canParse(headers: string[], sampleRows: string[][]): boolean {
    const headerJoined = headers.map((h) => h.toLowerCase()).join('|')
    const hasTxnHeaders =
      headerJoined.includes('fecha') &&
      headerJoined.includes('descripcion') &&
      (headerJoined.includes('valor dolares') || headerJoined.includes('valor dólares'))

    const labels = sampleRows
      .slice(0, 30)
      .map((r) => (r[0] ?? '').toLowerCase())
      .join('\n')

    const hasSummaryLabels =
      labels.includes('saldo actual') &&
      labels.includes('pago minimo') &&
      labels.includes('fecha de corte')

    return hasTxnHeaders && hasSummaryLabels
  }

  parse(params: {
    filename: string
    fileHash: string
    headers: string[]
    rows: string[][]
    columnMapping?: Record<string, string>
  }): ParsedStatementDraft {
    const draft = this.generic.parse(params)
    return {
      ...draft,
      issuer: 'produbanco',
    }
  }
}
