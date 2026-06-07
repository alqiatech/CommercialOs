// ============================================================
// ALQIA COMMERCIAL OS — Tipos base de entidades
// Reflejan exactamente el modelo de datos del Documento Maestro
// ============================================================

// ---- Enums compartidos ----

export type Status = 'active' | 'inactive' | 'suspended' | 'archived'
export type ActorType = 'user' | 'ai' | 'system' | 'integration'
export type Channel = 'whatsapp' | 'email' | 'phone' | 'sms' | 'note' | 'meeting' | 'form' | 'system'
export type Direction = 'inbound' | 'outbound' | 'internal'
export type ScoreType = 'data_trust' | 'lead_intent' | 'urgency' | 'conversion_probability' | 'churn_risk'
export type SeverityLevel = 'info' | 'low' | 'medium' | 'high' | 'critical'
export type TaskType = 'call' | 'whatsapp' | 'email' | 'meeting' | 'quote' | 'proposal' | 'review' | 'follow_up' | 'data_fix' | 'approval'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'

// ---- Tenant ----
export interface Tenant {
  id: string
  name: string
  slug: string
  legal_name: string
  status: Status
  plan: 'starter' | 'growth' | 'enterprise'
  billing_email: string
  owner_user_id: string
  settings: Record<string, unknown>
  branding: {
    logo_url?: string
    primary_color?: string
    secondary_color?: string
  }
  ai_enabled: boolean
  automation_enabled: boolean
  created_at: string
  updated_at: string
}

// ---- Company ----
export interface Company {
  id: string
  tenant_id: string
  name: string
  slug: string
  industry: string
  business_type: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country: string
  timezone: string
  branding: {
    logo_url?: string
    primary_color?: string
  }
  settings: Record<string, unknown>
  status: Status
  created_at: string
  updated_at: string
}

// ---- Branch ----
export interface Branch {
  id: string
  tenant_id: string
  company_id: string
  name: string
  code: string
  address?: string
  city?: string
  state?: string
  country?: string
  phone?: string
  email?: string
  manager_user_id?: string
  status: Status
  created_at: string
  updated_at: string
}

// ---- Role ----
export type RoleType =
  | 'super_admin_alqia'
  | 'owner'
  | 'admin'
  | 'sales_director'
  | 'sales_manager'
  | 'sales_rep'
  | 'analyst'
  | 'support'
  | 'guest'

export interface Role {
  id: string
  tenant_id: string
  name: string
  description: string
  level: number
  is_system_role: boolean
  permissions: Record<string, boolean>
  created_at: string
  updated_at: string
}

// ---- User ----
export interface User {
  id: string
  tenant_id: string
  auth_user_id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  role_id: string
  role_type: RoleType
  status: Status
  timezone: string
  last_login_at?: string
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ---- Contact ----
export type ContactStatus = 'active' | 'unreachable' | 'duplicate_merged' | 'do_not_contact' | 'invalid' | 'archived'
export type ConsentStatus = 'granted' | 'denied' | 'unknown' | 'expired'

export interface Contact {
  id: string
  tenant_id: string
  company_id?: string
  first_name: string
  last_name?: string
  full_name: string
  normalized_name: string
  email?: string
  normalized_email?: string
  phone?: string
  normalized_phone?: string
  whatsapp_phone?: string
  city?: string
  state?: string
  country?: string
  preferred_channel?: Channel
  consent_status: ConsentStatus
  data_trust_score: number
  identity_verification_status: 'unverified' | 'pending' | 'verified' | 'failed'
  tags: string[]
  metadata: Record<string, unknown>
  status: ContactStatus
  created_at: string
  updated_at: string
}

// ---- ContactChannel ----
export type ChannelType = 'email' | 'phone' | 'whatsapp' | 'sms' | 'social' | 'website'
export type ValidationStatus = 'unvalidated' | 'valid' | 'invalid' | 'risky' | 'unknown' | 'catch_all' | 'disposable'

export interface ContactChannel {
  id: string
  tenant_id: string
  contact_id: string
  channel_type: ChannelType
  value: string
  normalized_value: string
  is_primary: boolean
  validation_status: ValidationStatus
  validation_provider?: string
  validation_result: Record<string, unknown>
  last_validated_at?: string
  created_at: string
  updated_at: string
}

// ---- Account (empresa B2B) ----
export interface Account {
  id: string
  tenant_id: string
  company_id: string
  name: string
  normalized_name: string
  industry?: string
  website?: string
  email_domain?: string
  phone?: string
  city?: string
  state?: string
  country?: string
  size_estimate?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise'
  revenue_estimate?: number
  data_trust_score: number
  tags: string[]
  metadata: Record<string, unknown>
  status: Status
  created_at: string
  updated_at: string
}

// ---- Pipeline ----
export interface Pipeline {
  id: string
  tenant_id: string
  company_id: string
  name: string
  industry_template?: string
  description?: string
  is_default: boolean
  status: Status
  created_at: string
  updated_at: string
}

export type StageType = 'intake' | 'qualification' | 'contact' | 'proposal' | 'negotiation' | 'closing' | 'won' | 'lost' | 'reactivation'

export interface PipelineStage {
  id: string
  tenant_id: string
  pipeline_id: string
  name: string
  order_index: number
  probability_default: number
  max_days_in_stage?: number
  stage_type: StageType
  color: string
  rules: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ---- Opportunity ----
export type OpportunityStatus = 'open' | 'won' | 'lost' | 'paused' | 'archived' | 'reactivation'

export interface Opportunity {
  id: string
  tenant_id: string
  company_id: string
  branch_id?: string
  pipeline_id: string
  stage_id: string
  contact_id: string
  account_id?: string
  owner_user_id: string
  source_id?: string
  title: string
  description?: string
  product_interest?: string
  estimated_value?: number
  currency: string
  probability: number
  lead_intent_score: number
  data_trust_score: number
  urgency_score: number
  status: OpportunityStatus
  lost_reason?: string
  won_at?: string
  lost_at?: string
  expected_close_date?: string
  last_contact_at?: string
  next_action_at?: string
  ai_summary?: string
  created_at: string
  updated_at: string
  // Relaciones expandidas (joins)
  contact?: Contact
  stage?: PipelineStage
  owner?: User
}

// ---- Interaction ----
export interface Interaction {
  id: string
  tenant_id: string
  company_id: string
  opportunity_id?: string
  contact_id?: string
  account_id?: string
  user_id?: string
  agent_type: ActorType
  channel: Channel
  direction: Direction
  subject?: string
  content?: string
  summary?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  intent?: string
  outcome?: string
  metadata: Record<string, unknown>
  occurred_at: string
  created_at: string
}

// ---- Call ----
export type CallStatus = 'queued' | 'ringing' | 'completed' | 'failed' | 'no_answer' | 'busy' | 'voicemail' | 'cancelled'

export interface Call {
  id: string
  tenant_id: string
  interaction_id: string
  provider: string
  provider_call_id?: string
  from_number: string
  to_number: string
  duration_seconds?: number
  recording_url?: string
  transcript?: string
  ai_summary?: string
  call_status: CallStatus
  detected_intent?: string
  detected_objections: string[]
  next_action?: string
  cost_estimate?: number
  created_at: string
}

// ---- Message ----
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'rejected'

export interface Message {
  id: string
  tenant_id: string
  interaction_id: string
  provider: string
  provider_message_id?: string
  channel: 'whatsapp' | 'sms'
  template_id?: string
  from_value: string
  to_value: string
  body: string
  status: MessageStatus
  error_message?: string
  cost_estimate?: number
  sent_at?: string
  delivered_at?: string
  read_at?: string
  replied_at?: string
  created_at: string
}

// ---- Task ----
export interface Task {
  id: string
  tenant_id: string
  company_id: string
  opportunity_id?: string
  contact_id?: string
  account_id?: string
  assigned_to: string
  created_by: string
  title: string
  description?: string
  task_type: TaskType
  priority: TaskPriority
  due_at: string
  completed_at?: string
  status: TaskStatus
  source: 'manual' | 'ai' | 'cadence' | 'system'
  ai_generated: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Relaciones expandidas
  assignee?: User
  opportunity?: Opportunity
}

// ---- Cadence ----
export type CadenceTrigger = 'manual' | 'import_batch' | 'stage_entered' | 'no_activity' | 'ai_recommendation' | 'campaign'
export type CadenceStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'
export type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'stopped' | 'failed'

export interface Cadence {
  id: string
  tenant_id: string
  company_id: string
  name: string
  industry_template?: string
  description?: string
  trigger_type: CadenceTrigger
  target_type: 'opportunity' | 'contact'
  status: CadenceStatus
  rules: {
    no_weekends?: boolean
    allowed_hours_start?: number
    allowed_hours_end?: number
    max_attempts_per_week?: number
    pause_on_reply?: boolean
    pause_on_conversion?: boolean
    exclude_do_not_contact?: boolean
    require_approval_for_bulk?: boolean
  }
  created_by: string
  enrollment_count?: number
  reply_rate?: number
  conversion_rate?: number
  created_at: string
  updated_at: string
  steps?: CadenceStep[]
}

export interface CadenceStep {
  id: string
  tenant_id: string
  cadence_id: string
  order_index: number
  delay_amount: number
  delay_unit: 'hours' | 'days' | 'weeks'
  channel: Channel
  action_type: 'send_message' | 'make_call' | 'create_task' | 'send_email'
  template_id?: string
  requires_approval: boolean
  stop_on_reply: boolean
  stop_on_conversion: boolean
  rules: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CadenceEnrollment {
  id: string
  tenant_id: string
  cadence_id: string
  opportunity_id: string
  contact_id: string
  current_step_id?: string
  status: EnrollmentStatus
  enrolled_by: string
  enrolled_at: string
  paused_at?: string
  completed_at?: string
  stopped_reason?: string
  metadata: Record<string, unknown>
}

// ---- ImportBatch ----
export type ImportBatchStatus = 'uploaded' | 'mapping_pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type ImportSourceType = 'csv' | 'excel' | 'webhook' | 'api' | 'manual'

export interface ImportBatch {
  id: string
  tenant_id: string
  company_id: string
  branch_id?: string
  file_name: string
  file_url: string
  source_type: ImportSourceType
  imported_by: string
  total_rows: number
  processed_rows: number
  valid_rows: number
  invalid_rows: number
  duplicate_rows: number
  status: ImportBatchStatus
  mapping: Record<string, string>
  summary: {
    contacts_created?: number
    contacts_updated?: number
    opportunities_created?: number
    avg_data_trust_score?: number
    ready_for_cadence?: number
  }
  error_log?: Array<{ row: number; error: string }>
  created_at: string
  completed_at?: string
  imported_by_user?: User
}

// ---- RawLead ----
export interface RawLead {
  id: string
  tenant_id: string
  company_id: string
  import_batch_id: string
  source_type: ImportSourceType
  source_name?: string
  raw_payload: Record<string, unknown>
  normalized_payload: Record<string, unknown>
  processing_status: 'pending' | 'processed' | 'failed' | 'skipped'
  validation_status: 'unvalidated' | 'valid' | 'invalid' | 'partial'
  duplicate_status: 'unique' | 'duplicate_candidate' | 'duplicate_confirmed' | 'merged'
  contact_id?: string
  opportunity_id?: string
  created_at: string
  updated_at: string
}

// ---- AiFinding ----
export type FindingType =
  | 'opportunity_risk'
  | 'forgotten_leads'
  | 'data_quality'
  | 'seller_performance'
  | 'campaign_performance'
  | 'conversion_signal'
  | 'objection_pattern'
  | 'follow_up_gap'

export type FindingStatus = 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed'

export interface AiFinding {
  id: string
  tenant_id: string
  company_id: string
  finding_type: FindingType
  severity: SeverityLevel
  title: string
  description: string
  evidence: {
    count?: number
    entities?: Array<{ id: string; label: string }>
    metrics?: Record<string, number | string>
    explanation?: string
  }
  recommended_action: string
  confidence: number
  status: FindingStatus
  related_entity_type?: string
  related_entity_id?: string
  created_at: string
  resolved_at?: string
}

// ---- AiAction ----
export type AiActionType =
  | 'create_task'
  | 'send_message'
  | 'start_cadence'
  | 'assign_owner'
  | 'update_score'
  | 'generate_proposal'
  | 'call_lead'
  | 'mark_risk'
  | 'enrich_data'

export type AiActionStatus = 'suggested' | 'approved' | 'rejected' | 'executing' | 'executed' | 'failed'

export interface AiAction {
  id: string
  tenant_id: string
  company_id: string
  finding_id?: string
  action_type: AiActionType
  title: string
  description: string
  status: AiActionStatus
  requires_approval: boolean
  approved_by?: string
  executed_by?: string
  execution_result: Record<string, unknown>
  created_at: string
  approved_at?: string
  executed_at?: string
}

// ---- DataQualityCheck ----
export type CheckType =
  | 'email_format'
  | 'email_mx'
  | 'email_deliverability'
  | 'disposable_email'
  | 'phone_format'
  | 'phone_carrier'
  | 'phone_region'
  | 'whatsapp_availability'
  | 'identity_curp'
  | 'identity_ine'
  | 'duplicate_check'

export interface DataQualityCheck {
  id: string
  tenant_id: string
  entity_type: 'contact' | 'raw_lead'
  entity_id: string
  check_type: CheckType
  provider?: string
  input_value: string
  normalized_value?: string
  result_status: ValidationStatus
  result_payload: Record<string, unknown>
  confidence?: number
  cost_estimate?: number
  checked_at: string
  created_at: string
}

// ---- Score ----
export interface Score {
  id: string
  tenant_id: string
  entity_type: 'contact' | 'opportunity'
  entity_id: string
  score_type: ScoreType
  score_value: number
  score_breakdown: Record<string, number>
  calculated_by: ActorType
  calculated_at: string
}

// ---- Proposal ----
export type ProposalStatus = 'draft' | 'sent' | 'opened' | 'accepted' | 'rejected' | 'expired'

export interface Proposal {
  id: string
  tenant_id: string
  company_id: string
  opportunity_id: string
  title: string
  proposal_number: string
  status: ProposalStatus
  amount: number
  currency: string
  file_url?: string
  generated_by: string
  ai_generated: boolean
  sent_at?: string
  accepted_at?: string
  rejected_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

// ---- Quote ----
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface Quote {
  id: string
  tenant_id: string
  company_id: string
  opportunity_id: string
  quote_number: string
  status: QuoteStatus
  subtotal: number
  tax: number
  discount: number
  total: number
  currency: string
  valid_until?: string
  notes?: string
  file_url?: string
  created_by: string
  created_at: string
  updated_at: string
  items?: QuoteItem[]
}

export interface QuoteItem {
  id: string
  tenant_id: string
  quote_id: string
  product_service_id?: string
  description: string
  quantity: number
  unit_price: number
  discount: number
  total: number
  metadata: Record<string, unknown>
}

// ---- Campaign ----
export interface Campaign {
  id: string
  tenant_id: string
  company_id: string
  name: string
  source: string
  objective?: string
  start_date?: string
  end_date?: string
  budget?: number
  status: Status
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ---- LeadSource ----
export type LeadSourceType = 'csv' | 'excel' | 'website' | 'meta' | 'google' | 'manual' | 'whatsapp' | 'event' | 'referral' | 'phone' | 'api'

export interface LeadSource {
  id: string
  tenant_id: string
  company_id: string
  name: string
  source_type: LeadSourceType
  provider?: string
  external_id?: string
  status: Status
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ---- AuditLog ----
export interface AuditLog {
  id: string
  tenant_id: string
  actor_type: ActorType
  actor_id: string
  action: string
  entity_type: string
  entity_id: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// ---- Notification ----
export type NotificationType =
  | 'task_overdue'
  | 'hot_lead'
  | 'opportunity_at_risk'
  | 'client_replied'
  | 'call_completed'
  | 'ai_detected_interest'
  | 'ai_detected_objection'
  | 'quote_no_followup'
  | 'campaign_ended'
  | 'integration_error'

export interface Notification {
  id: string
  tenant_id: string
  user_id: string
  title: string
  body: string
  notification_type: NotificationType
  priority: 'low' | 'medium' | 'high'
  related_entity_type?: string
  related_entity_id?: string
  read_at?: string
  created_at: string
}

// ---- Tipos de UI / helpers ----
export interface KpiCard {
  id: string
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  severity?: 'success' | 'warning' | 'risk' | 'info' | 'neutral'
  actionLabel?: string
  onAction?: () => void
}
