import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createCustomRequest } from '@/lib/db/customRequests'

const schema = z.object({
  occasion:         z.string().min(1).max(200),
  servings:         z.number().int().positive().max(500),
  flavors:          z.string().min(1).max(500),
  dietaryNeeds:     z.string().max(500).nullable(),
  dateNeeded:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  referencePhotos:  z.array(z.string().url()).max(5).default([]),
  budgetCents:      z.number().int().positive().nullable(),
  notes:            z.string().max(2000).nullable(),
  guestEmail:       z.string().email().nullable(),
  customerLanguage: z.enum(['uk', 'en']),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body   = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data
  if (!user && !d.guestEmail) {
    return NextResponse.json({ error: 'Email required for guest requests' }, { status: 400 })
  }

  const req = await createCustomRequest({
    customerId:       user?.id ?? null,
    guestEmail:       d.guestEmail,
    occasion:         d.occasion,
    servings:         d.servings,
    flavors:          d.flavors,
    dietaryNeeds:     d.dietaryNeeds,
    dateNeeded:       d.dateNeeded,
    referencePhotos:  d.referencePhotos,
    budgetCents:      d.budgetCents,
    notes:            d.notes,
    customerLanguage: d.customerLanguage,
  })

  return NextResponse.json(req, { status: 201 })
}
