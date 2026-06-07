import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRequestById, updateRequestStatus } from '@/lib/db/customRequests'

export async function POST(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cr = await getRequestById(id)
  if (!cr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (cr.status !== 'quoted') return NextResponse.json({ error: 'Cannot approve in this state' }, { status: 409 })
  if (!user || cr.customerId !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await updateRequestStatus(id, 'approved')
  return NextResponse.json({ ok: true })
}
