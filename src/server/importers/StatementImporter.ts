import type { ParsedStatementDraft } from '../../shared/types/import'

export interface StatementImporter {
  readonly name: string
  canParse(headers: string[], sampleRows: string[][]): boolean
  parse(params: {
    filename: string
    fileHash: string
    headers: string[]
    rows: string[][]
    columnMapping?: Record<string, string>
  }): ParsedStatementDraft
}
