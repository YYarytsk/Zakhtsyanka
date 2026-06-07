import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getRequestById, addMessage, getMessages } from '@/lib/db/customRequests'

const schema = z.object({ body: z.string().min(1).max(2000) })

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params
  const messages = await getMessages(id)
  return NextResponse.json(messages)
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cr = await getRequestById(id)
  if (!cr) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Must be the owning customer or a guest with matching email
  const body   = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const isOwner = user && cr.customerId === user.id
  const isGuest = !user && (body as Record<string, string>)['guestEmail'] === cr.guestEmail
  if (!isOwner && !isGuest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const msg = await addMessage(id, 'customer', parsed.data.body)
  return NextResponse.json(msg, { status: 201 })
}
