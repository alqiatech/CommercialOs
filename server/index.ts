import { config } from 'dotenv'
import { resolve } from 'path'

// ── Cargar variables de entorno ANTES de cualquier import que las necesite ──
config({ path: resolve(process.cwd(), '.env.local') })

import express from 'express'
import cors from 'cors'
import aiRoutes from './routes/ai.routes'
import importRoutes from './routes/import.routes'
import dataTrustRoutes from './routes/dataTrust.routes'
import contactsRoutes from './routes/contacts.routes'
import opportunitiesRoutes from './routes/opportunities.routes'
import interactionsRoutes from './routes/interactions.routes'
import tasksRoutes from './routes/tasks.routes'
import authRoutes from './routes/auth.routes'
import sellersRoutes from './routes/sellers.routes'

// ─────────────────────────────────────────────────────────────────────────────
// Alqia Commercial OS — AI Gateway Server — Express
//
// SEGURIDAD:
// - OPENAI_API_KEY vive SOLO en server/.env.local
// - Nunca se expone a React, navegador ni localStorage
// - CORS limita a localhost en desarrollo
// ─────────────────────────────────────────────────────────────────────────────

const app = express()
const PORT = process.env.PORT ?? 3001

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
}))

// JSON normal — el upload de archivos lo maneja multer en su propio middleware
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/import/process')) {
    express.json({ limit: '20mb' })(req, _res, next)
  } else {
    express.json({ limit: '2mb' })(req, _res, next)
  }
})

// Request logger simple
app.use((req, _res, next) => {
  const mode = process.env.AI_MODE ?? 'mock'
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} [AI:${mode}]`)
  next()
})

// ── Health check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    ai_mode: process.env.AI_MODE ?? 'mock',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
  })
})

// ── Rutas ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/import', importRoutes)
app.use('/api/data-trust', dataTrustRoutes)
app.use('/api/contacts', contactsRoutes)
app.use('/api/opportunities', opportunitiesRoutes)
app.use('/api/interactions', interactionsRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/sellers', sellersRoutes)

// ── 404 ──────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// ── Iniciar ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`)
  console.log(`  Alqia Commercial OS  http://localhost:${PORT}`)
  console.log(`  Modo IA: ${process.env.AI_MODE ?? 'mock'}`)
  console.log(`  CORS: localhost (todos los puertos)`)
  console.log(`╚══════════════════════════════════════════╝\n`)
})

export default app
