import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { runSubscriptionBilling } from '@/lib/billing/subscriptions'

// Called daily by a cron job or Azure Container Apps Job.
// Protect with a shared secret so it can't be triggered by arbitrary requests.
// Set CRON_SECRET in env vars; pass it as Authorization: Bearer <secret>

export async function POST(request: NextRequest) {
  const auth   = request.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[cron/billing] Starting subscription billing run')
  const result = await runSubscriptionBilling()
  console.log('[cron/billing] Done', result)

  return NextResponse.json(result)
}
