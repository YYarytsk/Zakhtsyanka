import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { draftProductTranslation } from '@/lib/ai/translate'

const schema = z.object({
  nameUk:        z.string().min(1),
  descriptionUk: z.string(),
})

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function POST(request: NextRequest) {
  if (!await requireStaff()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body   = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  try {
    const result = await draftProductTranslation(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[ai/translate-product]', err)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
