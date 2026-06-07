import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription, updateSubscriptionStatus } from '@/lib/db/subscriptions'

export async function POST(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sub = await getSubscription(id)
  if (!sub || sub.customerId !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await updateSubscriptionStatus(id, 'cancelled')
  return NextResponse.json({ ok: true })
}
