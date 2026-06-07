// ─────────────────────────────────────────────────────────────────────────────
// apiClient.ts — Llamadas al servidor Alqia Commercial OS AI Gateway
//
// SEGURIDAD: Este archivo NUNCA incluye claves de API.
// La clave OpenAI vive exclusivamente en server/.env.local
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export interface ApiError {
  error: string
  details?: unknown
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as ApiError
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as ApiError
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Health ────────────────────────────────────────────────────────────────
export async function checkHealth(): Promise<{ status: string; ai_mode: string; model: string }> {
  const res = await fetch(`${BASE_URL}/health`)
  return res.json()
}

// ── Import ────────────────────────────────────────────────────────────────
export interface PreviewResult {
  filename: string
  size_bytes: number
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  previewRows: Record<string, string>[]
  suggestedMapping: Record<string, string>
  errors: string[]
}

export async function previewImport(file: File): Promise<PreviewResult> {
  const form = new FormData()
  form.append('file', file)
  return postForm('/api/import/preview', form)
}

export interface ImportMetrics {
  total: number
  ready_for_cadence: number
  needs_review: number
  duplicates: number
  invalid_email: number
  invalid_phone: number
  no_contact_channel: number
  do_not_contact: number
  avg_trust_score: number
  whatsapp_contactable: number
  email_contactable: number
}

export interface ProcessResult {
  leads: Array<{
    index: number
    cleaned: Record<string, unknown>
    trust: { score: number; classification: string; flags: string[]; contactable: boolean; whatsapp_probable: boolean }
    duplicate: { is_duplicate: boolean; type: string }
  }>
  metrics: ImportMetrics
  processed_at: string
}

export async function processImport(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
  company_id?: string,
): Promise<ProcessResult> {
  return post('/api/import/process', { rows, mapping, company_id })
}

// ── AI endpoints ──────────────────────────────────────────────────────────
export interface ClassifyLeadResult {
  lead_intent_score: number
  urgency_score: number
  detected_interest: string
  detected_objections: string[]
  recommended_channel: string
  next_best_action: string
  explanation: string
}

export async function classifyLead(lead: Record<string, string>, industryTemplate: string): Promise<ClassifyLeadResult> {
  return post('/api/ai/classify-lead', { ...lead, industryTemplate })
}

export interface MessageResult {
  channel: string
  message: string
  subject?: string
  reason: string
  required_approval: boolean
  character_count: number
}

export async function generateMessage(input: {
  industryTemplate: string
  opportunity_title: string
  contact_name: string
  stage: string
  last_interaction_summary?: string
  objective: 'follow_up' | 'close' | 'reactivate' | 'confirm' | 'schedule'
  tone?: 'warm' | 'consultative' | 'urgent' | 'formal'
  channel?: 'whatsapp' | 'email' | 'phone'
}): Promise<MessageResult> {
  return post('/api/ai/generate-message', input)
}

export interface OpportunitySummaryResult {
  summary: string
  current_context: string
  risks: string[]
  next_action: string
  missing_data: string[]
  urgency: 'low' | 'medium' | 'high' | 'critical'
  momentum: 'cold' | 'warm' | 'hot'
}

export async function summarizeOpportunity(input: {
  contact_name: string
  opportunity_title: string
  estimated_value?: number
  stage: string
  probability: number
  industryTemplate: string
  timeline?: Array<{ channel: string; summary: string; sentiment?: string; occurred_at: string }>
  notes?: string
}): Promise<OpportunitySummaryResult> {
  return post('/api/ai/summarize-opportunity', input)
}

export interface NextBestActionResult {
  action: string
  channel: string
  priority: string
  reason: string
  expected_outcome: string
  do_within_hours: number
}

export async function nextBestAction(input: {
  contact_name: string
  opportunity_title: string
  stage: string
  probability: number
  industryTemplate: string
  days_without_activity?: number
  last_sentiment?: string
  estimated_value?: number
}): Promise<NextBestActionResult> {
  return post('/api/ai/next-best-action', input)
}

export interface RadarResult {
  findings: Array<{
    id: string
    type: string
    severity: string
    title: string
    description: string
    evidence: string
    estimated_revenue_impact: number
    recommended_action: string
    confidence: number
    action_type: string
  }>
  analyzed_at: string
  model_used: string
}

export async function analyzeRadar(input: {
  companyName: string
  industryTemplate: string
  opportunities: Array<{
    id: string; title: string; stage_id: string
    estimated_value?: number; probability: number
    last_activity_at?: string; status: string
  }>
  interactions?: Array<{ opportunity_id: string; channel: string; occurred_at: string; sentiment?: string }>
}): Promise<RadarResult> {
  return post('/api/ai/radar', input)
}
