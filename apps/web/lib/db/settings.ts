import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { StoreSettingsRow } from './types'

export interface StoreSettings {
  id: string
  nameUk: string
  nameEn: string
  leadTimePickupHours: number
  leadTimeDeliveryHours: number
  hours: Record<string, { open: string; close: string } | null>
  deliveryZones: DeliveryZone[]
  holidayClosures: string[]
  ordersPaused: boolean
  announcementUk: string | null
  announcementEn: string | null
}

export interface DeliveryZone {
  id: string
  label: string
  postalCodes?: string[]
  radiusKm?: number
  feeCents: number
}

function mapSettings(row: StoreSettingsRow): StoreSettings {
  return {
    id:                     row.id,
    nameUk:                 row.name_uk,
    nameEn:                 row.name_en,
    leadTimePickupHours:    row.lead_time_pickup_hours,
    leadTimeDeliveryHours:  row.lead_time_delivery_hours,
    hours:                  row.hours as StoreSettings['hours'],
    deliveryZones:          (row.delivery_zones ?? []) as DeliveryZone[],
    holidayClosures:        row.holiday_closures ?? [],
    ordersPaused:           row.orders_paused,
    announcementUk:         row.announcement_uk,
    announcementEn:         row.announcement_en,
  }
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .single<StoreSettingsRow>()

  if (error || !data) throw new Error('Could not load store settings')
  return mapSettings(data)
}

export function validateDeliveryZone(
  postalCode: string,
  zones: DeliveryZone[],
): { valid: boolean; feeCents: number; zone: DeliveryZone | null } {
  const normalized = postalCode.trim().replace(/\s+/g, '')
  for (const zone of zones) {
    if (zone.postalCodes?.includes(normalized)) {
      return { valid: true, feeCents: zone.feeCents, zone }
    }
  }
  return { valid: false, feeCents: 0, zone: null }
}
