import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import { randomUUID } from 'node:crypto'
import type {
  CustomRequest, CustomRequestMessage, CustomRequestStatus, Locale,
} from '@zakhtsyanka/shared/types'

// ── Row types ─────────────────────────────────────────────────────────────────

interface RequestRow {
  id: string
  customer_id: string | null
  guest_email: string | null
  occasion: string
  servings: number
  flavors: string
  dietary_needs: string | null
  date_needed: string
  reference_photos: string[]
  budget_cents: number | null
  notes: string | null
  status: string
  quote_cents: number | null
  deposit_cents: number | null
  wfp_deposit_order_reference: string | null
  customer_language: string
  created_at: string
}

interface MessageRow {
  id: string
  request_id: string
  author_type: string
  body: string
  created_at: string
}

function mapRequest(r: RequestRow): CustomRequest {
  return {
    id:                       r.id,
    customerId:               r.customer_id,
    guestEmail:               r.guest_email,
    occasion:                 r.occasion,
    servings:                 r.servings,
    flavors:                  r.flavors,
    dietaryNeeds:             r.dietary_needs,
    dateNeeded:               r.date_needed,
    referencePhotos:          r.reference_photos,
    budgetCents:              r.budget_cents,
    notes:                    r.notes,
    status:                   r.status as CustomRequestStatus,
    quoteCents:               r.quote_cents,
    depositCents:             r.deposit_cents,
    wfpDepositOrderReference: r.wfp_deposit_order_reference,
    customerLanguage:         r.customer_language as Locale,
    createdAt:                r.created_at,
  }
}

function mapMessage(m: MessageRow): CustomRequestMessage {
  return {
    id:         m.id,
    requestId:  m.request_id,
    authorType: m.author_type as 'customer' | 'bakery',
    body:       m.body,
    createdAt:  m.created_at,
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export interface CreateRequestParams {
  customerId: string | null
  guestEmail: string | null
  occasion: string
  servings: number
  flavors: string
  dietaryNeeds: string | null
  dateNeeded: string
  referencePhotos: string[]
  budgetCents: number | null
  notes: string | null
  customerLanguage: Locale
}

export async function createCustomRequest(p: CreateRequestParams): Promise<CustomRequest> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_requests')
    .insert({
      id:               randomUUID(),
      customer_id:      p.customerId,
      guest_email:      p.guestEmail,
      occasion:         p.occasion,
      servings:         p.servings,
      flavors:          p.flavors,
      dietary_needs:    p.dietaryNeeds,
      date_needed:      p.dateNeeded,
      reference_photos: p.referencePhotos,
      budget_cents:     p.budgetCents,
      notes:            p.notes,
      customer_language: p.customerLanguage,
    })
    .select()
    .single<RequestRow>()
  if (error) throw new Error(`createCustomRequest: ${error.message}`)
  return mapRequest(data)
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getRequestById(id: string): Promise<CustomRequest | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_requests')
    .select()
    .eq('id', id)
    .single<RequestRow>()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getRequestById: ${error.message}`)
  }
  return data ? mapRequest(data) : null
}

export async function getRequestsByCustomer(customerId: string): Promise<CustomRequest[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_requests')
    .select()
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .returns<RequestRow[]>()
  if (error) throw new Error(`getRequestsByCustomer: ${error.message}`)
  return (data ?? []).map(mapRequest)
}

export async function getAllRequestsAdmin(): Promise<CustomRequest[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_requests')
    .select()
    .not('status', 'eq', 'completed')
    .order('created_at', { ascending: false })
    .returns<RequestRow[]>()
  if (error) throw new Error(`getAllRequestsAdmin: ${error.message}`)
  return (data ?? []).map(mapRequest)
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function getMessages(requestId: string): Promise<CustomRequestMessage[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_request_messages')
    .select()
    .eq('request_id', requestId)
    .order('created_at')
    .returns<MessageRow[]>()
  if (error) throw new Error(`getMessages: ${error.message}`)
  return (data ?? []).map(mapMessage)
}

export async function addMessage(
  requestId: string,
  authorType: 'customer' | 'bakery',
  body: string,
): Promise<CustomRequestMessage> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_request_messages')
    .insert({ request_id: requestId, author_type: authorType, body })
    .select()
    .single<MessageRow>()
  if (error) throw new Error(`addMessage: ${error.message}`)
  return mapMessage(data)
}

// ── Status updates ────────────────────────────────────────────────────────────

export async function updateRequestStatus(
  id: string,
  status: CustomRequestStatus,
  extra?: { quoteCents?: number; depositCents?: number; wfpRef?: string },
): Promise<void> {
  const supabase = createAdminClient()
  const update: Record<string, unknown> = { status }
  if (extra?.quoteCents   !== undefined) update['quote_cents']   = extra.quoteCents
  if (extra?.depositCents !== undefined) update['deposit_cents'] = extra.depositCents
  if (extra?.wfpRef       !== undefined) update['wfp_deposit_order_reference'] = extra.wfpRef

  const { error } = await supabase.from('custom_requests').update(update).eq('id', id)
  if (error) throw new Error(`updateRequestStatus: ${error.message}`)
}
