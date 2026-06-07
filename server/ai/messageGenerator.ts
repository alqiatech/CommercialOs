import { aiComplete } from './openaiClient'

// POST /api/ai/generate-message
// Genera un mensaje de seguimiento personalizado para un contacto
export async function messageGenerator(payload: {
  contact_name: string
  channel: 'whatsapp' | 'email' | 'phone'
  context: string            // etapa actual, último contacto, producto de interés
  industry_key: string
  seller_name: string
  company_name: string
  tone?: 'warm' | 'consultative' | 'urgent' | 'formal'
}) {
  const systemPrompt = `Eres un experto en comunicación comercial consultiva en español latinoamericano.
Genera mensajes de seguimiento naturales, no robóticos, adaptados al canal y contexto.
Para WhatsApp: máximo 3 párrafos cortos, informal pero profesional.
Para email: asunto + cuerpo estructurado, máximo 150 palabras.
Para teléfono: guión de apertura de 30 segundos.
NUNCA menciones plataformas, APIs, sistemas, ni términos técnicos.
Responde en JSON: { subject?: string, message: string, channel: string }`

  const userPrompt = `Redacta un mensaje de seguimiento con esta información:
- Contacto: ${payload.contact_name}
- Canal: ${payload.channel}
- Industria: ${payload.industry_key}
- Contexto: ${payload.context}
- Tono: ${payload.tone ?? 'warm'}
- Asesor: ${payload.seller_name}
- Empresa: ${payload.company_name}`

  const mockMessages: Record<string, object> = {
    whatsapp: {
      message: `Hola ${payload.contact_name}, soy ${payload.seller_name} de ${payload.company_name}. Quería hacerle un seguimiento rápido por lo que platicamos. ¿Tiene un momento esta semana para retomar la conversación?`,
      channel: 'whatsapp',
    },
    email: {
      subject: `Seguimiento — ${payload.company_name}`,
      message: `Estimado ${payload.contact_name},\n\nEspero que se encuentre bien. Le escribo para darle seguimiento a nuestra última conversación.\n\n${payload.context}\n\nQuedo a sus órdenes para cualquier duda.\n\n${payload.seller_name}\n${payload.company_name}`,
      channel: 'email',
    },
    phone: {
      message: `Hola, ${payload.contact_name}? Buenos días, soy ${payload.seller_name} de ${payload.company_name}. Le llamo para darle seguimiento a [contexto]. ¿Es buen momento?`,
      channel: 'phone',
    },
  }

  const mockResponse = JSON.stringify(mockMessages[payload.channel] ?? mockMessages.whatsapp)

  const result = await aiComplete(systemPrompt, userPrompt, mockResponse)
  try {
    return JSON.parse(result)
  } catch {
    return { message: result, channel: payload.channel }
  }
}
