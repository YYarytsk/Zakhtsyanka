import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getStoreSettings, validateDeliveryZone } from '@/lib/db/settings'

export async function GET(request: NextRequest) {
  const postalCode = request.nextUrl.searchParams.get('postalCode')?.trim()
  if (!postalCode) {
    return NextResponse.json({ error: 'postalCode is required' }, { status: 400 })
  }

  try {
    const settings = await getStoreSettings()
    const result   = validateDeliveryZone(postalCode, settings.deliveryZones)
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Could not validate delivery zone' }, { status: 500 })
  }
}
