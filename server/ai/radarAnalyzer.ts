import { aiComplete } from './openaiClient'

// POST /api/ai/radar
// Analiza el estado del pipeline y genera hallazgos priorizados
export async function radarAnalyzer(payload: {
  company_id: string
  industry_key: string
  pipeline_snapshot: {
    open_opportunities: number
    overdue_count: number
    stalled_count: number
    avg_days_in_stage: number
    hot_leads: number
  }
}) {
  const systemPrompt = `Eres el motor de análisis comercial de Alqia Commercial OS. 
Analiza el estado del pipeline de ventas y genera hallazgos concretos y priorizados.
Responde SIEMPRE en español. Sé directo, sin frases genéricas. 
Cada hallazgo debe tener: título (<10 palabras), descripción (1-2 oraciones), 
severidad (critical/high/medium/low), impacto estimado en MXN, y acción recomendada.
Responde en JSON: { findings: [{ title, description, severity, estimated_impact, recommended_action }] }`

  const userPrompt = `Empresa: ${payload.company_id}
Industria: ${payload.industry_key}
Pipeline actual:
- Oportunidades abiertas: ${payload.pipeline_snapshot.open_opportunities}
- Con seguimiento vencido: ${payload.pipeline_snapshot.overdue_count}
- Sin movimiento hace 14+ días: ${payload.pipeline_snapshot.stalled_count}
- Promedio días en etapa: ${payload.pipeline_snapshot.avg_days_in_stage}
- Leads con intención alta: ${payload.pipeline_snapshot.hot_leads}

Genera 3-5 hallazgos priorizados para este pipeline.`

  const mockResponse = JSON.stringify({
    findings: [
      {
        title: '8 oportunidades sin movimiento en 14 días',
        description: 'Detecté oportunidades estancadas en etapa de cotización que representan riesgo real de pérdida.',
        severity: 'critical',
        estimated_impact: 280000,
        recommended_action: 'Activar seguimiento urgente',
      },
      {
        title: '23 leads con intención alta sin contacto esta semana',
        description: 'Estos prospectos mostraron interés reciente pero no han recibido seguimiento.',
        severity: 'high',
        estimated_impact: 156000,
        recommended_action: 'Iniciar cadencia de reactivación',
      },
    ],
  })

  const result = await aiComplete(systemPrompt, userPrompt, mockResponse)
  try {
    return JSON.parse(result)
  } catch {
    return { findings: [], raw: result }
  }
}
