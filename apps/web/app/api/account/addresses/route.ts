import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAddress } from '@/lib/db/addresses'

const schema = z.object({
  label:      z.string().min(1).max(50),
  street:     z.string().min(1),
  city:       z.string().min(1),
  postalCode: z.string().min(1),
  isDefault:  z.boolean().default(false),
})

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const address = await createAddress(user.id, parsed.data)
  return NextResponse.json(address, { status: 201 })
}
