// ─────────────────────────────────────────────────────────────────────────────
// apiClient.ts — Llamadas al servidor Alqia Commercial OS AI Gateway
//
// SEGURIDAD: Este archivo NUNCA incluye claves de API.
// La clave OpenAI vive exclusivamente en server/.env.local
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')
const SESSION_STORAGE_KEY = 'alqia-auth-session'

export interface ApiError {
  error: string
  details?: unknown
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at?: number
}

const SESSION_EXPIRY_SKEW_SECONDS = 30

export function getStoredAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

export function storeAuthSession(session: AuthSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredAuthSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function isSessionExpired(session: AuthSession, skewSeconds = SESSION_EXPIRY_SKEW_SECONDS): boolean {
  if (!session.expires_at) return false
  return session.expires_at <= Math.floor(Date.now() / 1000) + skewSeconds
}

function connectionErrorMessage() {
  return 'No se pudo conectar con el servidor API. Revisa VITE_API_BASE_URL o el proxy de produccion.'
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(connectionErrorMessage())
    }
    throw error
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as ApiError
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(connectionErrorMessage())
    }
    throw error
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as ApiError
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function getWithAuth<T>(path: string, token: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(connectionErrorMessage())
    }
    throw error
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as ApiError
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function get<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`)
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(connectionErrorMessage())
    }
    throw error
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as ApiError
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      body: form,
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(connectionErrorMessage())
    }
    throw error
  }
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

export interface AuthApiUser {
  id: string
  auth_user_id?: string
  tenant_id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  role_type: 'super_admin_alqia' | 'owner' | 'admin' | 'sales_director' | 'sales_manager' | 'sales_rep' | 'analyst' | 'support' | 'guest'
  status: 'active' | 'inactive' | 'suspended' | 'archived'
  timezone?: string
  preferences?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  user_company_access?: Array<{
    company_id: string
    branch_id?: string | null
    access_level: string
    companies?: {
      id: string
      name: string
      slug: string
      industry_key?: string | null
      city?: string | null
      country?: string | null
      status: string
      settings?: Record<string, unknown> | null
    } | null
  }>
}

export async function loginWithPassword(email: string, password: string): Promise<{ session: AuthSession; user: AuthApiUser }> {
  return post('/api/auth/login', { email, password })
}

export async function fetchCurrentUser(token: string): Promise<{ user: AuthApiUser }> {
  return getWithAuth('/api/auth/me', token)
}

export async function refreshAuthSession(refreshToken: string): Promise<{ session: AuthSession; user: AuthApiUser }> {
  return post('/api/auth/refresh', { refresh_token: refreshToken })
}

export async function logout(token?: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as ApiError
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
}

export interface OpportunityListItem {
  id: string
  title: string
  product_interest?: string | null
  estimated_value?: number | null
  probability: number
  lead_intent_score: number
  data_trust_score: number
  urgency_score: number
  status: string
  last_contact_at?: string | null
  owner_user_id?: string | null
  contact?: {
    id: string
    full_name: string
    email?: string | null
    phone?: string | null
    whatsapp_phone?: string | null
    data_trust_score?: number
    city?: string | null
  } | null
  stage?: {
    id: string
    name: string
    order_index: number
    stage_type: string
    color?: string
    probability_default?: number
  } | null
}

export async function fetchOpportunities(companyId: string, filters?: { owner_user_id?: string; status?: string; stage_id?: string }): Promise<{ data: OpportunityListItem[]; count: number }> {
  const params = new URLSearchParams({ company_id: companyId })
  if (filters?.owner_user_id) params.set('owner_user_id', filters.owner_user_id)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.stage_id) params.set('stage_id', filters.stage_id)
  return get(`/api/opportunities?${params.toString()}`)
}

export interface ImportBatchListItem {
  id: string
  filename?: string
  file_name?: string
  status: string
  total_rows?: number
  valid_rows?: number
  invalid_rows?: number
  duplicate_rows?: number
  contacts_created?: number
  contacts_updated?: number
  created_at: string
}

export async function fetchImportBatches(companyId: string): Promise<{ data: ImportBatchListItem[] }> {
  return get(`/api/import/batches?company_id=${encodeURIComponent(companyId)}`)
}

export interface ContactListItem {
  id: string
  full_name: string
  email?: string | null
  normalized_email?: string | null
  phone?: string | null
  normalized_phone?: string | null
  whatsapp_phone?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  consent_status: 'granted' | 'denied' | 'unknown' | 'expired'
  data_trust_score: number
  status: string
  email_validation_status?: string
  phone_validation_status?: string
  whatsapp_validation_status?: string
}

export async function fetchContacts(companyId: string): Promise<{ data: ContactListItem[]; count: number }> {
  return get(`/api/contacts?company_id=${encodeURIComponent(companyId)}&limit=200`)
}

export interface InteractionListItem {
  id: string
  opportunity_id?: string | null
  contact_id?: string | null
  user_id?: string | null
  agent_type: string
  channel: string
  direction: string
  subject?: string | null
  content?: string | null
  summary?: string | null
  sentiment?: string | null
  occurred_at: string
  created_at: string
}

export async function fetchInteractions(companyId: string): Promise<{ data: InteractionListItem[] }> {
  return get(`/api/interactions?company_id=${encodeURIComponent(companyId)}&limit=100`)
}

export interface OpportunityDetailResult {
  id: string
  title: string
  estimated_value?: number | null
  probability: number
  lead_intent_score: number
  data_trust_score: number
  urgency_score: number
  product_interest?: string | null
  ai_summary?: string | null
  next_action_at?: string | null
  owner_user_id?: string | null
  status: string
  contact?: ContactListItem | null
  stage?: {
    id: string
    name: string
    order_index: number
    stage_type: string
  } | null
  interactions?: InteractionListItem[]
  tasks?: Array<{
    id: string
    type?: string
    title: string
    priority: string
    status: string
    due_at?: string | null
    assigned_to?: string | null
  }>
}

export async function fetchOpportunityDetail(opportunityId: string): Promise<OpportunityDetailResult> {
  return get(`/api/opportunities/${encodeURIComponent(opportunityId)}`)
}

export async function updateOpportunityStage(opportunityId: string, input: { stage_id: string; user_id?: string }) {
  return patch(`/api/opportunities/${encodeURIComponent(opportunityId)}/stage`, input)
}

export async function updateOpportunityStatus(opportunityId: string, input: { status: 'won' | 'lost' | 'open' | 'paused'; lost_reason?: string }) {
  return patch(`/api/opportunities/${encodeURIComponent(opportunityId)}/status`, input)
}

export async function updateOpportunityOwner(opportunityId: string, input: { owner_user_id: string | null }) {
  return patch(`/api/opportunities/${encodeURIComponent(opportunityId)}`, input)
}

export interface FindingListItem {
  id: string
  type?: string
  finding_type?: string
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  description?: string | null
  evidence?: string | Record<string, unknown> | null
  recommended_action?: string | null
  recommendation?: string | null
  confidence?: number | null
  created_at: string
}

export async function fetchAiFindings(companyId: string): Promise<{ data: FindingListItem[] }> {
  return get(`/api/ai/findings?company_id=${encodeURIComponent(companyId)}&limit=30`)
}

export interface SellerListItem {
  id: string
  tenant_id: string
  company_id: string
  full_name: string
  email: string
  phone?: string | null
  role_type: 'super_admin_alqia' | 'owner' | 'admin' | 'sales_director' | 'sales_manager' | 'sales_rep' | 'analyst' | 'support' | 'guest'
  access_level?: string | null
  branch_id?: string | null
  status: string
  created_at: string
  updated_at: string
  metrics: {
    open_opportunities: number
    won_last_30_days: number
    lost_last_30_days: number
    conversion_rate: number
    pipeline_value: number
  }
}

export async function fetchSellers(companyId: string): Promise<{ data: SellerListItem[] }> {
  return get(`/api/sellers?company_id=${encodeURIComponent(companyId)}`)
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
  persisted?: {
    batch_id: string
    tenant_id: string
    company_id: string
    contacts_created: number
    contacts_updated: number
    opportunities_created: number
    duplicate_rows: number
  }
}

export interface TaskListItem {
  id: string
  tenant_id: string
  company_id: string
  contact_id?: string | null
  opportunity_id?: string | null
  assigned_to?: string | null
  created_by?: string | null
  type: string
  priority: string
  status: string
  title: string
  description?: string | null
  due_at?: string | null
  completed_at?: string | null
  ai_generated?: boolean
  metadata?: Record<string, unknown>
  created_at: string
  updated_at?: string
}

export async function fetchTasks(filters: {
  company_id?: string
  assigned_to?: string
  opportunity_id?: string
  status?: string
  overdue?: boolean
  limit?: number
}): Promise<{ data: TaskListItem[]; total: number; page: number; limit: number }> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    params.set(key, String(value))
  })
  return get(`/api/tasks?${params.toString()}`)
}

export async function createTask(input: {
  tenant_id: string
  company_id: string
  contact_id?: string | null
  opportunity_id?: string | null
  assigned_to?: string | null
  created_by?: string | null
  type?: string
  priority?: string
  title: string
  description?: string
  due_at?: string
  ai_generated?: boolean
  metadata?: Record<string, unknown>
}): Promise<{ data: TaskListItem }> {
  return post('/api/tasks', input)
}

export async function updateTask(taskId: string, input: Partial<Pick<TaskListItem, 'title' | 'description' | 'type' | 'priority' | 'status' | 'due_at' | 'assigned_to' | 'metadata'>>): Promise<{ data: TaskListItem }> {
  return patch(`/api/tasks/${encodeURIComponent(taskId)}`, input)
}

export async function processImport(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
  company_id?: string,
  filename?: string,
  user_id?: string,
  industry_template?: string,
): Promise<ProcessResult> {
  return post('/api/import/process', { rows, mapping, company_id, filename, user_id, industry_template })
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
