import { aiComplete } from '../ai/openaiClient'
import type { SummarizeOpportunityInput, NextBestActionInput } from '../schemas/ai.schemas'

// ─────────────────────────────────────────────────────────────────────────────
// aiOpportunitySummary — Resumen estratégico de una oportunidad
// aiNextBestAction — Siguiente acción óptima
// ─────────────────────────────────────────────────────────────────────────────

export interface OpportunitySummaryResult {
  summary: string
  current_context: string
  risks: string[]
  next_action: string
  missing_data: string[]
  urgency: 'low' | 'medium' | 'high' | 'critical'
  momentum: 'cold' | 'warm' | 'hot'
}

export interface NextBestActionResult {
  action: string
  channel: 'whatsapp' | 'email' | 'phone' | 'task' | 'none'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reason: string
  expected_outcome: string
  do_within_hours: number
}

const MOCK_SUMMARY: OpportunitySummaryResult = {
  summary: 'Oportunidad de mediano valor en etapa de negociación activa. El contacto ha mostrado interés sostenido.',
  current_context: 'Propuesta enviada hace menos de una semana. Contacto pendiente de respuesta de dirección.',
  risks: ['Sin respuesta puede indicar evaluación interna', 'Posible comparación con competidor'],
  next_action: 'Llamar hoy para confirmar si recibieron la propuesta y ofrecer resolver dudas técnicas',
  missing_data: ['presupuesto aprobado', 'fecha límite de decisión'],
  urgency: 'medium',
  momentum: 'warm',
}

const MOCK_NBA: NextBestActionResult = {
  action: 'Llamar al contacto para dar seguimiento a la propuesta enviada',
  channel: 'phone',
  priority: 'high',
  reason: 'Sin respuesta en más de 5 días. Etapa de cotización requiere seguimiento activo.',
  expected_outcome: 'Confirmar estado de evaluación y agendar reunión de cierre esta semana',
  do_within_hours: 24,
}

export async function aiOpportunitySummary(input: SummarizeOpportunityInput): Promise<OpportunitySummaryResult> {
  const systemPrompt = `Eres un estratega comercial experto en ${input.industryTemplate}.
Analiza la oportunidad y devuelve SOLO JSON válido:
{
  "summary": "resumen en 1-2 oraciones",
  "current_context": "situación actual concreta",
  "risks": ["array de riesgos"],
  "next_action": "acción inmediata concreta",
  "missing_data": ["datos que faltan para avanzar"],
  "urgency": "low|medium|high|critical",
  "momentum": "cold|warm|hot"
}
Responde en español.`

  const timeline = input.timeline?.slice(-5) ?? []
  const timelineSummary = timeline.length
    ? timeline.map(t => `- ${t.occurred_at?.split('T')[0]}: ${t.channel} — ${t.summary} (${t.sentiment})`).join('\n')
    : 'Sin interacciones registradas'

  const userPrompt = `Oportunidad: ${input.opportunity_title}
Contacto: ${input.contact_name}
Valor estimado: ${input.estimated_value?.toLocaleString() ?? 'no especificado'}
Etapa: ${input.stage}
Probabilidad: ${input.probability}%
Últimas interacciones:
${timelineSummary}
Notas: ${input.notes || 'ninguna'}`

  try {
    const raw = await aiComplete(systemPrompt, userPrompt, JSON.stringify(MOCK_SUMMARY), 800)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return MOCK_SUMMARY
    return JSON.parse(jsonMatch[0]) as OpportunitySummaryResult
  } catch {
    return MOCK_SUMMARY
  }
}

export async function aiNextBestAction(input: NextBestActionInput): Promise<NextBestActionResult> {
  const systemPrompt = `Eres un coach de ventas experto en ${input.industryTemplate}.
Recomienda la siguiente acción más efectiva. Devuelve SOLO JSON válido:
{
  "action": "descripción de la acción",
  "channel": "whatsapp|email|phone|task|none",
  "priority": "low|medium|high|urgent",
  "reason": "justificación en 1 oración",
  "expected_outcome": "resultado esperado",
  "do_within_hours": number de horas recomendadas
}
Responde en español.`

  const userPrompt = `Oportunidad: ${input.opportunity_title}
Contacto: ${input.contact_name}
Etapa: ${input.stage}
Probabilidad: ${input.probability}%
Días sin actividad: ${input.days_without_activity ?? 0}
Último sentimiento: ${input.last_sentiment ?? 'neutro'}
Valor estimado: ${input.estimated_value?.toLocaleString() ?? 'no especificado'}`

  try {
    const raw = await aiComplete(systemPrompt, userPrompt, JSON.stringify(MOCK_NBA), 500)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return MOCK_NBA
    return JSON.parse(jsonMatch[0]) as NextBestActionResult
  } catch {
    return MOCK_NBA
  }
}
