import { aiComplete } from '../ai/openaiClient'
import type { ClassifyLeadInput } from '../schemas/ai.schemas'

// ─────────────────────────────────────────────────────────────────────────────
// aiLeadClassifier — Clasifica intención comercial con criterio de IA
// La normalización ya fue hecha antes de llegar aquí.
// ─────────────────────────────────────────────────────────────────────────────

export interface LeadClassificationResult {
  lead_intent_score: number     // 0-100
  urgency_score: number         // 0-100
  detected_interest: string
  detected_objections: string[]
  recommended_channel: 'whatsapp' | 'email' | 'phone' | 'none'
  next_best_action: string
  explanation: string
}

const MOCK: LeadClassificationResult = {
  lead_intent_score: 72,
  urgency_score: 55,
  detected_interest: 'Producto de alto valor detectado en comentarios',
  detected_objections: ['precio', 'tiempo'],
  recommended_channel: 'whatsapp',
  next_best_action: 'Enviar cotización personalizada y agendar llamada en 24h',
  explanation: 'Lead con datos completos y señales de interés activo. Sin urgencia crítica pero con buena disposición.',
}

export async function aiLeadClassifier(input: ClassifyLeadInput): Promise<LeadClassificationResult> {
  const systemPrompt = `Eres un experto en análisis comercial B2C/B2B. 
Analiza el prospecto y devuelve SOLO JSON válido con esta estructura exacta:
{
  "lead_intent_score": number 0-100,
  "urgency_score": number 0-100,
  "detected_interest": "string corto",
  "detected_objections": ["array de strings"],
  "recommended_channel": "whatsapp|email|phone|none",
  "next_best_action": "acción concreta en una oración",
  "explanation": "justificación breve máx 2 oraciones"
}
Industria: ${input.industryTemplate}. Responde en español.`

  const userPrompt = `Prospecto:
- Nombre: ${input.full_name || 'desconocido'}
- Email: ${input.email || 'no proporcionado'}
- Teléfono: ${input.phone || 'no proporcionado'}
- Ciudad: ${input.city || 'desconocida'}
- Empresa: ${input.company || 'no especificada'}
- Producto/Interés: ${input.product_interest || 'no especificado'}
- Fuente: ${input.source || 'desconocida'}
- Comentarios: ${input.comments || 'ninguno'}`

  const mockJson = JSON.stringify(MOCK)

  try {
    const raw = await aiComplete(systemPrompt, userPrompt, mockJson)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return MOCK
    return JSON.parse(jsonMatch[0]) as LeadClassificationResult
  } catch {
    return MOCK
  }
}
