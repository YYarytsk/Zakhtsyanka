import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getOrderById, updateOrderStatus } from '@/lib/db/orders'
import { getStoreSettings } from '@/lib/db/settings'
import { sendOrderStatusUpdate } from '@/lib/notifications/email'
import type { OrderStatus } from '@zakhtsyanka/shared/types'

const schema = z.object({
  status: z.enum([
    'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled',
  ]),
})

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  if (!await requireStaff()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await props.params
  const body   = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const order = await getOrderById(id)
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await updateOrderStatus(id, parsed.data.status as OrderStatus)

  // Fire-and-forget notification
  const settings = await getStoreSettings().catch(() => null)
  const storeName = order.customerLanguage === 'uk'
    ? (settings?.nameUk ?? process.env.NEXT_PUBLIC_STORE_NAME_UK ?? 'Захцянка')
    : (settings?.nameEn ?? process.env.NEXT_PUBLIC_STORE_NAME_EN ?? 'Zakhtsyanka')

  sendOrderStatusUpdate({ ...order, status: parsed.data.status as OrderStatus }, storeName)
    .catch((err) => console.error('[admin-status] email failed:', err))

  return NextResponse.json({ ok: true })
}
