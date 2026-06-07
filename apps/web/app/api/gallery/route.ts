import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get('tag')
  const supabase = createAdminClient()

  let q = supabase
    .from('gallery')
    .select('id, caption_uk, caption_en, photos, tags, sort_order')
    .eq('is_published', true)
    .order('sort_order')

  if (tag) q = q.contains('tags', [tag])

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
