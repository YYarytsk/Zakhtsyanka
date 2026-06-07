import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { randomUUID } from 'node:crypto'

const schema = z.object({
  captionUk:   z.string().min(1),
  captionEn:   z.string().min(1),
  photos:      z.array(z.string()).min(1),
  tags:        z.array(z.string()).default([]),
  isPublished: z.boolean().default(true),
  sortOrder:   z.number().int().default(0),
})

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function GET() {
  const admin = createAdminClient()
  const { data } = await admin.from('gallery').select('*').order('sort_order')
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  if (!await requireStaff()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const d = parsed.data
  const admin = createAdminClient()
  const { data, error } = await admin.from('gallery').insert({
    id:           randomUUID(),
    caption_uk:   d.captionUk,
    caption_en:   d.captionEn,
    photos:       d.photos,
    tags:         d.tags,
    is_published: d.isPublished,
    sort_order:   d.sortOrder,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
