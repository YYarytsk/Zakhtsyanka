import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrderById } from '@/lib/db/orders'

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await getOrderById(id)
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (order.customerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(order)
}
