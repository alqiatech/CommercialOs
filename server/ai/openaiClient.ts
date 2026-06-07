import OpenAI from 'openai'

// ─────────────────────────────────────────────────────────────────────────────
// Cliente OpenAI — instanciado solo en el servidor.
// La clave OPENAI_API_KEY vive en server/.env.local y jamás se expone al
// navegador. No usar el prefijo VITE_ para ninguna clave de producción.
//
// NOTA: AI_MODE y OPENAI_MODEL se leen como función lazy (no constante) para
// evitar el problema de hoisting de módulos ESM — los imports se procesan
// antes de que dotenv.config() cargue las variables de entorno.
// ─────────────────────────────────────────────────────────────────────────────

export const OPENAI_MODEL = () => process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
export const AI_MODE = () => (process.env.AI_MODE ?? 'mock') as 'mock' | 'real'

let _client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (_client) return _client
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.startsWith('sk-...')) {
    throw new Error('OPENAI_API_KEY no está configurada en server/.env.local')
  }
  _client = new OpenAI({ apiKey })
  return _client
}

// Helper para llamadas con fallback a mock si AI_MODE=mock o falla la API
export async function aiComplete(
  systemPrompt: string,
  userPrompt: string,
  mockResponse: string,
  maxTokens = 800,
): Promise<string> {
  if (AI_MODE() === 'mock') {
    return mockResponse
  }
  try {
    const client = getOpenAIClient()
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.4,
    })
    return response.choices[0]?.message?.content ?? mockResponse
  } catch (err) {
    console.warn('[aiComplete] Fallo OpenAI, usando mock fallback:', (err as Error).message)
    return mockResponse
  }
}
