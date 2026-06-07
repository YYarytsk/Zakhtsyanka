import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

// First-run endpoint: creates the first staff/admin account.
// Rejected if any staff member already exists.

const schema = z.object({
  role: z.enum(['admin', 'staff']).default('admin'),
})

export async function POST(request: NextRequest) {
  const admin = createAdminClient()

  // Guard: reject if staff already exist
  const { count } = await admin
    .from('staff')
    .select('id', { count: 'exact', head: true })

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Setup already completed. Sign in and use the admin panel.' },
      { status: 409 },
    )
  }

  // Must be signed in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Sign in first, then complete setup.' }, { status: 401 })
  }

  const body   = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  const role   = parsed.success ? parsed.data.role : 'admin'

  // Insert into staff
  const { error } = await admin.from('staff').insert({
    id:    user.id,
    email: user.email ?? '',
    role,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You are already a staff member.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, role, email: user.email })
}

export async function GET() {
  const admin = createAdminClient()
  const { count } = await admin
    .from('staff')
    .select('id', { count: 'exact', head: true })

  return NextResponse.json({ setupDone: (count ?? 0) > 0 })
}
