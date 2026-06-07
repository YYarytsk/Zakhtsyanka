import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { updateRequestStatus, addMessage } from '@/lib/db/customRequests'
import type { CustomRequestStatus } from '@zakhtsyanka/shared/types'

const schema = z.object({
  status:       z.enum(['quoted','approved','deposit_paid','scheduled','completed','cancelled']).optional(),
  quoteCents:   z.number().int().positive().optional(),
  depositCents: z.number().int().positive().optional(),
  message:      z.string().min(1).max(2000).optional(),
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
  if (!await requireStaff()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await props.params
  const body   = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { status, quoteCents, depositCents, message } = parsed.data

  if (status || quoteCents !== undefined) {
    await updateRequestStatus(
      id,
      (status ?? 'quoted') as CustomRequestStatus,
      { quoteCents, depositCents },
    )
  }

  if (message) {
    await addMessage(id, 'bakery', message)
  }

  return NextResponse.json({ ok: true })
}
