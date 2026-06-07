import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Schemas Zod para los endpoints de IA
// Validación de entrada — nunca procesamos datos sin validar
// ─────────────────────────────────────────────────────────────────────────────

export const ClassifyLeadInput = z.object({
  industryTemplate: z.string(),
  full_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  city: z.string().optional(),
  product_interest: z.string().optional(),
  source: z.string().optional(),
  comments: z.string().optional(),
})

export const RadarInput = z.object({
  companyName: z.string(),
  industryTemplate: z.string(),
  opportunities: z.array(z.object({
    id: z.string(),
    title: z.string(),
    stage_id: z.string(),
    estimated_value: z.number().optional(),
    probability: z.number(),
    last_activity_at: z.string().optional(),
    status: z.string(),
  })).max(50),
  interactions: z.array(z.object({
    opportunity_id: z.string(),
    channel: z.string(),
    occurred_at: z.string(),
    sentiment: z.string().optional(),
  })).max(100).optional(),
})

export const GenerateMessageInput = z.object({
  industryTemplate: z.string(),
  opportunity_title: z.string(),
  contact_name: z.string(),
  stage: z.string(),
  last_interaction_summary: z.string().optional(),
  objective: z.enum(['follow_up', 'close', 'reactivate', 'confirm', 'schedule']),
  tone: z.enum(['warm', 'consultative', 'urgent', 'formal']).default('warm'),
  channel: z.enum(['whatsapp', 'email', 'phone']).default('whatsapp'),
})

export const SummarizeOpportunityInput = z.object({
  contact_name: z.string(),
  opportunity_title: z.string(),
  estimated_value: z.number().optional(),
  stage: z.string(),
  probability: z.number(),
  industryTemplate: z.string(),
  timeline: z.array(z.object({
    channel: z.string(),
    summary: z.string(),
    sentiment: z.string().optional(),
    occurred_at: z.string(),
  })).max(20).optional(),
  notes: z.string().optional(),
})

export const NextBestActionInput = z.object({
  contact_name: z.string(),
  opportunity_title: z.string(),
  stage: z.string(),
  probability: z.number(),
  industryTemplate: z.string(),
  days_without_activity: z.number().optional(),
  last_sentiment: z.string().optional(),
  estimated_value: z.number().optional(),
})

export type ClassifyLeadInput = z.infer<typeof ClassifyLeadInput>
export type RadarInput = z.infer<typeof RadarInput>
export type GenerateMessageInput = z.infer<typeof GenerateMessageInput>
export type SummarizeOpportunityInput = z.infer<typeof SummarizeOpportunityInput>
export type NextBestActionInput = z.infer<typeof NextBestActionInput>
