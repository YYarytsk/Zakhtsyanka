import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { addMessage } from '@/lib/db/customRequests'

const schema = z.object({ body: z.string().min(1).max(2000) })

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  if (!await requireStaff()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await props.params
  const body   = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const msg = await addMessage(id, 'bakery', parsed.data.body)
  return NextResponse.json(msg, { status: 201 })
}
