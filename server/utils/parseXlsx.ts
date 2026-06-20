import * as XLSX from 'xlsx'
import { detectColumnMapping } from '../services/columnMapper'
import type { ParseResult } from './parseCsv'

// ─────────────────────────────────────────────────────────────────────────────
// parseXlsx — Lee XLSX/XLS y devuelve misma estructura que parseCsv
// ─────────────────────────────────────────────────────────────────────────────

export function parseXlsxBuffer(buffer: Buffer): ParseResult {
  const errors: string[] = []

  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { headers: [], rows: [], totalRows: 0, previewRows: [], suggestedMapping: {}, errors: ['Archivo sin hojas'] }
  }

  const sheet = workbook.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json<Array<string | number | boolean | Date | null>>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })

  if (!raw.length) {
    return { headers: [], rows: [], totalRows: 0, previewRows: [], suggestedMapping: {}, errors: ['Hoja vacía'] }
  }

  // Primera fila como headers
  const headerRow = raw[0] ?? []
  const headers = headerRow.map(h => String(h ?? '').trim()).filter(Boolean)

  const rows: Record<string, string>[] = []
  for (let i = 1; i < raw.length; i++) {
    const rowArr = raw[i] ?? []
    const record: Record<string, string> = {}
    let hasValue = false
    headers.forEach((h, idx) => {
      const cell = rowArr[idx]
      let v = ''
      if (cell instanceof Date) {
        v = cell.toISOString().split('T')[0]
      } else {
        v = String(cell ?? '').trim()
      }
      record[h] = v
      if (v) hasValue = true
    })
    if (hasValue) rows.push(record)
  }

  return {
    headers,
    rows,
    totalRows: rows.length,
    previewRows: rows.slice(0, 20),
    suggestedMapping: detectColumnMapping(headers),
    errors,
  }
}
