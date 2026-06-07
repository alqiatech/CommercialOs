import Papa from 'papaparse'
import { detectColumnMapping } from '../services/columnMapper'

// ─────────────────────────────────────────────────────────────────────────────
// parseCsv — Lee CSV y devuelve headers + primeras N filas + sugerencias mapeo
// ─────────────────────────────────────────────────────────────────────────────

export interface ParseResult {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  previewRows: Record<string, string>[]   // primeras 20
  suggestedMapping: Record<string, string>
  errors: string[]
}

export function parseCsvBuffer(buffer: Buffer, encoding: BufferEncoding = 'utf8'): ParseResult {
  const text = buffer.toString(encoding)
  const errors: string[] = []

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  })

  if (result.errors.length) {
    for (const e of result.errors.slice(0, 5)) {
      errors.push(`Fila ${e.row ?? '?'}: ${e.message}`)
    }
  }

  const headers = result.meta.fields ?? []
  const rows = (result.data as Record<string, string>[]).filter(r =>
    Object.values(r).some(v => v.trim() !== '')
  )

  return {
    headers,
    rows,
    totalRows: rows.length,
    previewRows: rows.slice(0, 20),
    suggestedMapping: detectColumnMapping(headers),
    errors,
  }
}
