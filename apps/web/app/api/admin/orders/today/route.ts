import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrdersForAdmin } from '@/lib/db/orders'

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function GET() {
  if (!await requireStaff()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const today  = new Date().toISOString().slice(0, 10)
  const orders = await getOrdersForAdmin(today)
  return NextResponse.json(orders)
}
