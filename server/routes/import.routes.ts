import { Router } from 'express'
import multer from 'multer'
import { parseCsvBuffer } from '../utils/parseCsv'
import { parseXlsxBuffer } from '../utils/parseXlsx'
import { processImport } from '../services/importProcessor'
import { persistImportBatch } from '../services/importPersistence'
import { supabaseAdmin } from '../services/supabaseAdmin'
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

// GET /api/import/batches?company_id=
router.get('/batches', async (req, res) => {
  const { company_id, limit = '20' } = req.query as Record<string, string>
  if (!company_id) {
    res.status(400).json({ error: 'company_id requerido' })
    return
  }

  try {
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)))
    const { data, error } = await supabaseAdmin
      .from('import_batches')
      .select('*')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .limit(pageSize)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ data: data ?? [] })
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar importaciones', details: String(err) })
  }
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
router.post('/process', async (req, res) => {
  const parsed = ProcessImportInput.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
    return
  }

  try {
    const result = processImport(parsed.data.rows, parsed.data.mapping as Record<string, import('../schemas/import.schemas').DestinationField>)
    const persisted = await persistImportBatch({
      companyRef: parsed.data.company_id,
      filename: parsed.data.filename,
      industryTemplate: parsed.data.industry_template,
      userId: parsed.data.user_id,
      mapping: parsed.data.mapping,
      leads: result.leads,
      metrics: result.metrics,
    })

    res.json({
      ...result,
      persisted,
    })
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar importación', details: String(err) })
  }
})

export default router
