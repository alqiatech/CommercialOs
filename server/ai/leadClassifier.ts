import { aiComplete } from './openaiClient'

// POST /api/ai/classify-lead
// Evalúa la calidad de un prospecto basado en sus datos y contexto
export async function leadClassifier(payload: {
  contact: {
    name: string
    phone?: string
    email?: string
    source?: string
    notes?: string
  }
  industry_key: string
  company_id: string
}) {
  const systemPrompt = `Eres el clasificador de prospectos de Alqia Commercial OS. 
Analiza los datos de un contacto y asigna una puntuación de intención (0-100) 
y una categoría de calidad (hot/warm/cold/invalid).
Responde en español. Responde en JSON: 
{ 
  score: number,         // 0-100
  category: 'hot'|'warm'|'cold'|'invalid',
  confidence: 'high'|'medium'|'low',
  signals: string[],     // señales positivas detectadas
  risks: string[],       // señales de riesgo
  recommended_action: string
}`

  const userPrompt = `Clasifica este prospecto para la industria ${payload.industry_key}:
Nombre: ${payload.contact.name}
Teléfono: ${payload.contact.phone ?? 'no proporcionado'}
Email: ${payload.contact.email ?? 'no proporcionado'}
Fuente: ${payload.contact.source ?? 'desconocida'}
Notas: ${payload.contact.notes ?? 'ninguna'}`

  const mockResponse = JSON.stringify({
    score: 65,
    category: 'warm',
    confidence: 'medium',
    signals: ['Tiene teléfono válido', 'Fuente identificada'],
    risks: ['Sin email — canal de seguimiento limitado', 'Sin notas de interés específico'],
    recommended_action: 'Llamada de calificación en próximas 24 horas',
  })

  const result = await aiComplete(systemPrompt, userPrompt, mockResponse)
  try {
    return JSON.parse(result)
  } catch {
    return { score: 50, category: 'warm', raw: result }
  }
}
