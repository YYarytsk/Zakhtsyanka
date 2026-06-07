// GET /api/orders — returns all orders for the authenticated customer.
// Used by the mobile app; web uses server-side DB calls directly.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrdersByCustomer } from '@/lib/db/orders'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orders = await getOrdersByCustomer(user.id)
  return NextResponse.json(orders)
}
