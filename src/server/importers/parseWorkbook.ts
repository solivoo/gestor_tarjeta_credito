import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import * as XLSX from 'xlsx'

export interface WorkbookParseResult {
  filename: string
  fileHash: string
  headers: string[]
  rows: string[][]
}

export function hashFile(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

/**
 * Some bank exports (e.g. Produbanco) ship malformed ranges like "1:G68"
 * instead of "A1:G68", which makes SheetJS throw "invalid column -1".
 */
export function normalizeSheetRef(sheet: XLSX.WorkSheet): void {
  const keys = Object.keys(sheet).filter((key) => !key.startsWith('!'))
  if (!keys.length) return

  let minRow = Infinity
  let maxRow = 0
  let minCol = Infinity
  let maxCol = 0

  for (const key of keys) {
    const cell = XLSX.utils.decode_cell(key)
    if (!Number.isFinite(cell.r) || !Number.isFinite(cell.c) || cell.c < 0) {
      delete sheet[key]
      continue
    }
    minRow = Math.min(minRow, cell.r)
    maxRow = Math.max(maxRow, cell.r)
    minCol = Math.min(minCol, cell.c)
    maxCol = Math.max(maxCol, cell.c)
  }

  if (!Number.isFinite(minRow) || !Number.isFinite(minCol)) return

  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: minRow, c: minCol },
    e: { r: maxRow, c: maxCol },
  })
}

function looksLikeTransactionHeader(cells: string[]): boolean {
  const joined = cells.join(' ').toLowerCase()
  const hasDate = cells.some((c) => /fecha/i.test(c))
  const hasDesc = cells.some((c) => /desc|detalle|concepto/i.test(c))
  const hasAmount = cells.some((c) => /valor|monto|importe|amount/i.test(c))
  return (hasDate && hasDesc && hasAmount) || (cells.length >= 4 && /tarjeta/.test(joined))
}

export function parseWorkbookFromBuffer(
  buffer: Buffer,
  filename: string,
): WorkbookParseResult {
  const fileHash = hashFile(buffer)
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('El archivo Excel no contiene hojas')
  }
  const sheet = workbook.Sheets[sheetName]
  normalizeSheetRef(sheet)

  const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  })

  const nonEmpty = matrix.filter((row) =>
    row.some((cell) => String(cell ?? '').trim() !== ''),
  )

  if (!nonEmpty.length) {
    throw new Error('El archivo Excel está vacío')
  }

  let headerIndex = -1
  for (let i = 0; i < nonEmpty.length; i += 1) {
    const cells = nonEmpty[i].map((c) => String(c ?? '').trim()).filter(Boolean)
    if (looksLikeTransactionHeader(cells)) {
      headerIndex = i
      break
    }
  }

  if (headerIndex < 0) {
    for (let i = 0; i < Math.min(nonEmpty.length, 80); i += 1) {
      const cells = nonEmpty[i].map((c) => String(c ?? '').trim()).filter(Boolean)
      if (cells.length >= 3) {
        headerIndex = i
        break
      }
    }
  }

  if (headerIndex < 0) headerIndex = 0

  const headers = nonEmpty[headerIndex].map((c) => String(c ?? '').trim())
  const rows = nonEmpty.slice(headerIndex + 1).map((row) =>
    headers.map((_, idx) => String(row[idx] ?? '').trim()),
  )

  const labelRows = nonEmpty.slice(0, headerIndex).map((row) =>
    row.map((c) => String(c ?? '').trim()),
  )

  return {
    filename: basename(filename),
    fileHash,
    headers,
    rows: [...labelRows, ...rows],
  }
}

export function parseWorkbookFromPath(filePath: string): WorkbookParseResult {
  return parseWorkbookFromBuffer(readFileSync(filePath), filePath)
}
