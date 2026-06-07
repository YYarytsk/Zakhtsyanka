import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const BIRTHDAY_POINTS = 50  // points awarded on birthday

// Run daily alongside billing cron.
// schedule: 0 7 * * * (07:00 Kyiv time, after billing runs at 06:00)

export async function POST(request: NextRequest) {
  const auth   = request.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date()
  const month = today.getMonth() + 1
  const day   = today.getDate()

  // Find customers whose birthday is today (any year)
  const { data: customers } = await supabase
    .from('customers')
    .select('id, email')
    .filter('extract(month from birthday_date)', 'eq', month)
    .filter('extract(day   from birthday_date)', 'eq', day)
    .returns<Array<{ id: string; email: string }>>()

  if (!customers || customers.length === 0) {
    return NextResponse.json({ awarded: 0 })
  }

  let awarded = 0
  for (const customer of customers) {
    // Check that we haven't already awarded this year
    const thisYear = today.getFullYear()
    const yearStart = `${thisYear}-01-01`
    const { count } = await supabase
      .from('loyalty_transactions')
      .select('id', { count: 'exact' })
      .eq('customer_id', customer.id)
      .eq('reason', 'birthday_bonus')
      .gte('created_at', yearStart)

    if ((count ?? 0) > 0) continue  // already awarded this year

    await supabase.from('loyalty_transactions').insert({
      customer_id: customer.id,
      points:      BIRTHDAY_POINTS,
      reason:      'birthday_bonus',
    })

    await supabase.rpc('increment_loyalty_balance', {
      p_customer_id: customer.id,
      p_points:      BIRTHDAY_POINTS,
    })

    awarded++
  }

  console.log(`[birthday-rewards] Awarded ${BIRTHDAY_POINTS} pts to ${awarded}/${customers.length} customers`)
  return NextResponse.json({ awarded, total: customers.length })
}
