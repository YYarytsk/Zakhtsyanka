import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProductionList } from '@/lib/db/subscriptions'

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function GET(request: NextRequest) {
  if (!await requireStaff()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const list = await getProductionList(date)
  return NextResponse.json(list)
}
