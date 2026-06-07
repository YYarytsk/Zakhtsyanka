import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription, skipNextFulfillment } from '@/lib/db/subscriptions'

export async function POST(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sub = await getSubscription(id)
  if (!sub || sub.customerId !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (sub.status !== 'active') return NextResponse.json({ error: 'Not active' }, { status: 409 })
  await skipNextFulfillment(id, sub.nextFulfillmentDate)
  return NextResponse.json({ ok: true })
}
