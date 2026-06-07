import { aiComplete } from '../ai/openaiClient'
import type { RadarInput } from '../schemas/ai.schemas'

// ─────────────────────────────────────────────────────────────────────────────
// aiRadarService — Genera hallazgos estratégicos del Revenue Radar con IA real
// ─────────────────────────────────────────────────────────────────────────────

export interface RadarFinding {
  id: string
  type: 'follow_up_gap' | 'forgotten_leads' | 'conversion_signal' | 'opportunity_risk' | 'data_quality'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  evidence: string
  estimated_revenue_impact: number
  recommended_action: string
  confidence: number
  action_type: string
}

export interface RadarResult {
  findings: RadarFinding[]
  analyzed_at: string
  model_used: string
}

const MOCK_FINDINGS: RadarFinding[] = [
  {
    id: 'r001',
    type: 'follow_up_gap',
    severity: 'critical',
    title: '5 oportunidades sin actividad en más de 7 días',
    description: 'Hay oportunidades abiertas con alto valor potencial sin ninguna interacción reciente. El silencio en etapas avanzadas suele indicar enfriamiento.',
    evidence: 'Última interacción hace 8-14 días en etapas de cotización y negociación',
    estimated_revenue_impact: 320000,
    recommended_action: 'Asignar tarea de seguimiento urgente para cada oportunidad afectada',
    confidence: 0.92,
    action_type: 'create_task',
  },
  {
    id: 'r002',
    type: 'conversion_signal',
    severity: 'high',
    title: 'Leads con señal de financiamiento cierran 2x más rápido',
    description: 'Prospectos que preguntan por opciones de pago o financiamiento en las primeras 2 interacciones tienen tasa de cierre significativamente mayor.',
    evidence: '3 leads activos con esta señal sin cadencia de cierre activa',
    estimated_revenue_impact: 185000,
    recommended_action: 'Activar cadencia de cierre para leads con señal de financiamiento',
    confidence: 0.87,
    action_type: 'activate_cadence',
  },
]

export async function aiRadarService(input: RadarInput): Promise<RadarResult> {
  // Preparar resumen de datos para la IA (no enviamos todo, solo lo necesario)
  const openOpps = input.opportunities.filter(o => o.status === 'open')
  const wonOpps = input.opportunities.filter(o => o.status === 'won')
  const lostOpps = input.opportunities.filter(o => o.status === 'lost')

  // Detectar oportunidades sin actividad reciente
  const now = new Date()
  const staleOpps = openOpps.filter(o => {
    if (!o.last_activity_at) return true
    const lastActivity = new Date(o.last_activity_at)
    const days = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    return days > 5
  })

  const systemPrompt = `Eres el motor de análisis estratégico de Alqia Commercial OS.
Analiza los datos comerciales y genera hallazgos accionables.
Devuelve SOLO JSON válido con estructura:
{
  "findings": [
    {
      "id": "string único",
      "type": "follow_up_gap|forgotten_leads|conversion_signal|opportunity_risk|data_quality",
      "severity": "critical|high|medium|low",
      "title": "título conciso máx 80 chars",
      "description": "descripción con contexto, máx 200 chars",
      "evidence": "dato específico que soporta el hallazgo",
      "estimated_revenue_impact": number en MXN o USD,
      "recommended_action": "acción concreta en una oración",
      "confidence": number 0.0-1.0,
      "action_type": "create_task|send_message|activate_cadence|schedule_call|review_data"
    }
  ]
}
Máximo 5 hallazgos. Prioriza por impacto económico. Industria: ${input.industryTemplate}. Responde en español.`

  const userPrompt = `Empresa: ${input.companyName}
Pipeline actual:
- Oportunidades abiertas: ${openOpps.length} (valor estimado total: ${openOpps.reduce((s, o) => s + (o.estimated_value ?? 0), 0).toLocaleString()})
- Ganadas: ${wonOpps.length}
- Perdidas: ${lostOpps.length}
- Sin actividad >5 días: ${staleOpps.length} (${staleOpps.map(o => o.title).join(', ') || 'ninguna'})

Top 5 oportunidades abiertas:
${openOpps.slice(0, 5).map(o => `- "${o.title}" | ${o.stage_id} | ${o.probability}% prob | $${(o.estimated_value ?? 0).toLocaleString()} | última act: ${o.last_activity_at || 'nunca'}`).join('\n')}

Interacciones recientes: ${input.interactions?.length ?? 0} registradas`

  const mockJson = JSON.stringify({ findings: MOCK_FINDINGS })

  try {
    const raw = await aiComplete(systemPrompt, userPrompt, mockJson, 1200)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { findings: MOCK_FINDINGS, analyzed_at: now.toISOString(), model_used: 'mock' }
    const parsed = JSON.parse(jsonMatch[0]) as { findings: RadarFinding[] }
    return {
      findings: parsed.findings ?? MOCK_FINDINGS,
      analyzed_at: now.toISOString(),
      model_used: process.env.OPENAI_MODEL ?? 'mock',
    }
  } catch {
    return { findings: MOCK_FINDINGS, analyzed_at: now.toISOString(), model_used: 'mock' }
  }
}
