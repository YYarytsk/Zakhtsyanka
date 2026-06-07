import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  if (!await requireStaff()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await props.params
  const admin = createAdminClient()
  await admin.from('gallery').delete().eq('id', id)
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  if (!await requireStaff()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await props.params
  const body = await request.json().catch(() => ({})) as Record<string, unknown>

  const update: Record<string, unknown> = {}
  if (body['isPublished'] !== undefined) update['is_published'] = body['isPublished']
  if (body['sortOrder']   !== undefined) update['sort_order']   = body['sortOrder']
  if (body['captionUk']   !== undefined) update['caption_uk']   = body['captionUk']
  if (body['captionEn']   !== undefined) update['caption_en']   = body['captionEn']
  if (body['tags']        !== undefined) update['tags']         = body['tags']

  const admin = createAdminClient()
  const { data, error } = await admin.from('gallery').update(update).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
