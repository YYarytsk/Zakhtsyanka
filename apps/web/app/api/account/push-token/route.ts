// Store Expo push token on the customer row so the server can send push notifications.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

const schema = z.object({ token: z.string().min(1) })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  // Store on customers row — add push_token column via migration if needed
  const admin = createAdminClient()
  await admin.from('customers').update({ push_token: parsed.data.token }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
