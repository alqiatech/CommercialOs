import { aiComplete } from '../ai/openaiClient'
import type { GenerateMessageInput } from '../schemas/ai.schemas'

// ─────────────────────────────────────────────────────────────────────────────
// aiMessageGenerator — Genera mensajes WhatsApp/Email personalizados
// ─────────────────────────────────────────────────────────────────────────────

export interface MessageResult {
  channel: 'whatsapp' | 'email' | 'phone'
  message: string
  subject?: string           // solo para email
  reason: string
  required_approval: boolean
  character_count: number
}

const MOCK_WHATSAPP: MessageResult = {
  channel: 'whatsapp',
  message: 'Hola [Nombre], espero que estés bien. Quería retomar nuestra conversación sobre [producto]. ¿Tienes unos minutos esta semana para que revisemos juntos la propuesta? 😊',
  reason: 'Seguimiento estándar post-cotización — tono cálido para reactivar interés',
  required_approval: false,
  character_count: 165,
}

const MOCK_EMAIL: MessageResult = {
  channel: 'email',
  subject: 'Siguiendo con tu consulta — [Empresa]',
  message: 'Hola [Nombre],\n\nEspero que tengas una excelente semana. Me pongo en contacto para dar seguimiento a la propuesta que te compartí el [fecha].\n\n¿Hay algún punto que quieras revisar o ajustar antes de avanzar?\n\nQuedo a tus órdenes,\n[Asesor]',
  reason: 'Email de seguimiento formal para etapa de cotización avanzada',
  required_approval: false,
  character_count: 280,
}

export async function aiMessageGenerator(input: GenerateMessageInput): Promise<MessageResult> {
  const channelLabel = { whatsapp: 'WhatsApp', email: 'correo electrónico', phone: 'llamada de teléfono' }[input.channel]
  const objectiveLabel = {
    follow_up: 'dar seguimiento',
    close: 'cerrar la venta',
    reactivate: 'reactivar un lead frío',
    confirm: 'confirmar una cita o acuerdo',
    schedule: 'agendar una reunión o llamada',
  }[input.objective]

  const isMxWhatsapp = input.channel === 'whatsapp'
  const maxChars = isMxWhatsapp ? 400 : 600

  const systemPrompt = `Eres un experto en comunicación comercial para empresas latinoamericanas.
Crea un mensaje de ${channelLabel} para ${objectiveLabel}.
Devuelve SOLO JSON válido:
{
  "channel": "${input.channel}",
  "message": "texto del mensaje",
  ${input.channel === 'email' ? '"subject": "asunto del correo",' : ''}
  "reason": "justificación breve",
  "required_approval": false,
  "character_count": número
}
Restricciones: máx ${maxChars} caracteres. Tono: ${input.tone}. Industria: ${input.industryTemplate}.
NO uses corchetes vacíos — personaliza con los datos reales. Responde en español.`

  const userPrompt = `Oportunidad: ${input.opportunity_title}
Contacto: ${input.contact_name}
Etapa: ${input.stage}
Última interacción: ${input.last_interaction_summary || 'ninguna registrada'}
Objetivo: ${objectiveLabel}`

  const mockResponse = input.channel === 'email'
    ? JSON.stringify({ ...MOCK_EMAIL, channel: input.channel })
    : JSON.stringify({ ...MOCK_WHATSAPP, channel: input.channel })

  try {
    const raw = await aiComplete(systemPrompt, userPrompt, mockResponse, 600)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return input.channel === 'email' ? MOCK_EMAIL : MOCK_WHATSAPP
    const parsed = JSON.parse(jsonMatch[0]) as MessageResult
    parsed.character_count = parsed.message?.length ?? 0
    return parsed
  } catch {
    return input.channel === 'email' ? MOCK_EMAIL : MOCK_WHATSAPP
  }
}
