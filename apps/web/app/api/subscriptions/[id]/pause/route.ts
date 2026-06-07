import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription, updateSubscriptionStatus } from '@/lib/db/subscriptions'

async function ownerOrDeny(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const sub = await getSubscription(id)
  if (!sub || sub.customerId !== user.id) return null
  return sub
}

export async function POST(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const sub = await ownerOrDeny(id)
  if (!sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (sub.status !== 'active') return NextResponse.json({ error: 'Not active' }, { status: 409 })
  await updateSubscriptionStatus(id, 'paused')
  return NextResponse.json({ ok: true })
}
