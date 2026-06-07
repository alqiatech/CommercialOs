import { aiComplete } from './openaiClient'

// POST /api/ai/summarize-opportunity
// Resume el historial de una oportunidad y recomienda el siguiente paso
export async function opportunitySummarizer(payload: {
  opportunity: {
    title: string
    stage: string
    days_in_stage: number
    estimated_value: number
    probability: number
  }
  recent_interactions: Array<{
    channel: string
    summary: string
    occurred_at: string
  }>
  industry_key: string
}) {
  const systemPrompt = `Eres el asistente de análisis de oportunidades de Alqia Commercial OS.
Resume el estado de una oportunidad de venta y recomienda el siguiente paso más efectivo.
Sé directo y accionable. Responde en español.
Responde en JSON: {
  summary: string,          // 2-3 oraciones del estado actual
  momentum: 'advancing'|'stalled'|'at_risk'|'closing',
  next_action: string,      // acción específica y clara
  urgency: 'now'|'today'|'this_week'|'low',
  risk_flag?: string        // si hay riesgo, descríbelo brevemente
}`

  const interactionsSummary = payload.recent_interactions
    .slice(0, 5)
    .map(i => `- ${i.channel} (${i.occurred_at.split('T')[0]}): ${i.summary}`)
    .join('\n')

  const userPrompt = `Analiza esta oportunidad:
Nombre: ${payload.opportunity.title}
Etapa actual: ${payload.opportunity.stage}
Días en esta etapa: ${payload.opportunity.days_in_stage}
Valor estimado: $${payload.opportunity.estimated_value.toLocaleString()} MXN
Probabilidad: ${payload.opportunity.probability}%
Industria: ${payload.industry_key}

Interacciones recientes:
${interactionsSummary || 'Sin interacciones registradas'}`

  const mockResponse = JSON.stringify({
    summary: `Esta oportunidad lleva ${payload.opportunity.days_in_stage} días en la etapa "${payload.opportunity.stage}" sin avance. El cliente ha mostrado interés pero no ha habido contacto reciente para resolver sus dudas.`,
    momentum: payload.opportunity.days_in_stage > 14 ? 'stalled' : 'advancing',
    next_action: `Llamar hoy a ${payload.opportunity.title} para confirmar el estado de la decisión y ofrecer resolver dudas pendientes.`,
    urgency: payload.opportunity.days_in_stage > 14 ? 'today' : 'this_week',
    risk_flag: payload.opportunity.days_in_stage > 21 ? 'Más de 3 semanas sin avance — riesgo de perder la oportunidad' : undefined,
  })

  const result = await aiComplete(systemPrompt, userPrompt, mockResponse)
  try {
    return JSON.parse(result)
  } catch {
    return { summary: result, momentum: 'stalled', next_action: 'Revisar manualmente' }
  }
}
