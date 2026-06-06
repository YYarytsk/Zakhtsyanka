import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

const schema = z.object({
  ordersPaused:    z.boolean().optional(),
  announcementUk:  z.string().max(500).nullable().optional(),
  announcementEn:  z.string().max(500).nullable().optional(),
  leadTimePickupHours:   z.number().int().positive().optional(),
  leadTimeDeliveryHours: z.number().int().positive().optional(),
})

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function PATCH(request: NextRequest) {
  if (!await requireStaff()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body   = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (parsed.data.ordersPaused    !== undefined) update['orders_paused']             = parsed.data.ordersPaused
  if (parsed.data.announcementUk  !== undefined) update['announcement_uk']           = parsed.data.announcementUk
  if (parsed.data.announcementEn  !== undefined) update['announcement_en']           = parsed.data.announcementEn
  if (parsed.data.leadTimePickupHours   !== undefined) update['lead_time_pickup_hours']   = parsed.data.leadTimePickupHours
  if (parsed.data.leadTimeDeliveryHours !== undefined) update['lead_time_delivery_hours'] = parsed.data.leadTimeDeliveryHours

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('store_settings').update(update).neq('id', '')
  if (error) {
    console.error('[admin-settings]', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('store_settings').select('*').single()
  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })
  return NextResponse.json(data)
}
