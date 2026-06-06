import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getStoreSettings } from '@/lib/db/settings'
import { generateSlotRange } from '@/lib/db/slots'

export async function GET(request: NextRequest) {
  const sp   = request.nextUrl.searchParams
  const type = sp.get('type') === 'delivery' ? 'delivery' : 'pickup'
  const days = Math.min(parseInt(sp.get('days') ?? '7'), 14)

  try {
    const settings = await getStoreSettings()

    if (settings.ordersPaused) {
      return NextResponse.json({ paused: true, slots: {} })
    }

    const slots = generateSlotRange(type, settings, days)
    return NextResponse.json({ paused: false, slots })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Could not load slots' }, { status: 500 })
  }
}
