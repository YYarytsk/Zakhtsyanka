import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Uses a security-definer Postgres function — no service role key required.
// The function enforces: must be authenticated, and only works when zero staff exist.

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in first, then complete setup.' },
      { status: 401 },
    )
  }

  const { data, error } = await supabase.rpc('setup_first_admin')

  if (error) {
    console.error('[admin/setup]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = data as { ok?: boolean; error?: string; email?: string }

  if (result.error === 'not_authenticated') {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  }
  if (result.error === 'already_setup') {
    return NextResponse.json(
      { error: 'Setup already completed. Sign in and go to /admin/orders.' },
      { status: 409 },
    )
  }

  return NextResponse.json({ ok: true, email: result.email })
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('staff_exists')
  return NextResponse.json({ setupDone: error ? false : !!data })
}
