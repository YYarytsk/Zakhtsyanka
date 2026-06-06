import { NextResponse } from 'next/server'
import { getOrderById } from '@/lib/db/orders'

// Lightweight polling endpoint used by ConfirmationPoller.
export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params
  try {
    const order = await getOrderById(id)
    if (!order) return NextResponse.json({ status: 'not_found' }, { status: 404 })
    return NextResponse.json({ status: order.status })
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
