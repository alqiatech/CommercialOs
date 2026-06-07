import { Router } from 'express'
import multer from 'multer'
import { parseCsvBuffer } from '../utils/parseCsv'
import { parseXlsxBuffer } from '../utils/parseXlsx'
import { processImport } from '../services/importProcessor'
import { ProcessImportInput } from '../schemas/import.schemas'

// ─────────────────────────────────────────────────────────────────────────────
// Rutas de importación — /api/import/
// ─────────────────────────────────────────────────────────────────────────────

const router = Router()

// Multer: guardar archivo en memoria (máx 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'application/octet-stream']
    const extOk = /\.(csv|xlsx|xls)$/i.test(file.originalname)
    if (extOk) return cb(null, true)
    cb(new Error('Solo se permiten archivos CSV, XLS o XLSX'))
  },
})

// POST /api/import/preview — sube archivo, detecta columnas, devuelve preview
router.post('/preview', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se recibió ningún archivo' })
    return
  }

  try {
    const ext = req.file.originalname.split('.').pop()?.toLowerCase()
    const result = ext === 'csv'
      ? parseCsvBuffer(req.file.buffer)
      : parseXlsxBuffer(req.file.buffer)

    res.json({
      filename: req.file.originalname,
      size_bytes: req.file.size,
      ...result,
    })
  } catch (err) {
    res.status(500).json({ error: 'Error al leer archivo', details: String(err) })
  }
})

// POST /api/import/process — procesa filas con el mapeo confirmado
router.post('/process', (req, res) => {
  const parsed = ProcessImportInput.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
    return
  }

  try {
    const result = processImport(parsed.data.rows, parsed.data.mapping as Record<string, import('../schemas/import.schemas').DestinationField>)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar importación', details: String(err) })
  }
})

export default router
