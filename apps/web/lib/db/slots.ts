import 'server-only'
import type { TimeSlot } from '@zakhtsyanka/shared/types'
import type { StoreSettings } from './settings'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const SLOT_MINUTES = 30

/**
 * Generate available time slots for a given date and order type.
 * Capacity enforcement (per-product daily cap) happens at checkout,
 * not here — this returns kitchen availability only.
 */
export function generateSlotsForDate(
  date: Date,
  type: 'pickup' | 'delivery',
  settings: StoreSettings,
  now: Date = new Date(),
): TimeSlot[] {
  // Closed today?
  const dayKey = DAY_KEYS[date.getDay()]
  const hours = dayKey !== undefined ? settings.hours[dayKey] : null
  if (!hours) return []

  // Holiday?
  const dateStr = formatDateLocal(date)
  if (settings.holidayClosures.includes(dateStr)) return []

  // Orders paused?
  if (settings.ordersPaused) return []

  // Earliest bookable moment (now + lead time)
  const leadHours =
    type === 'pickup' ? settings.leadTimePickupHours : settings.leadTimeDeliveryHours
  const earliest = new Date(now.getTime() + leadHours * 60 * 60 * 1000)

  // Build slot boundaries
  const [openH, openM] = parseTime(hours.open)
  const [closeH, closeM] = parseTime(hours.close)

  const openTime = new Date(date)
  openTime.setHours(openH, openM, 0, 0)

  const closeTime = new Date(date)
  closeTime.setHours(closeH, closeM, 0, 0)

  const slots: TimeSlot[] = []
  const cursor = new Date(openTime)

  while (cursor < closeTime) {
    slots.push({
      datetime: cursor.toISOString(),
      available: cursor >= earliest,
      remainingCapacity: null, // checked at order creation
    })
    cursor.setMinutes(cursor.getMinutes() + SLOT_MINUTES)
  }

  return slots
}

/** Return slots for the next `days` calendar days (including today). */
export function generateSlotRange(
  type: 'pickup' | 'delivery',
  settings: StoreSettings,
  days = 7,
  now: Date = new Date(),
): Record<string, TimeSlot[]> {
  const result: Record<string, TimeSlot[]> = {}

  for (let i = 0; i < days; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    const key = formatDateLocal(d)
    result[key] = generateSlotsForDate(d, type, settings, now)
  }

  return result
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseTime(hhmm: string): [number, number] {
  const parts = hhmm.split(':')
  return [parseInt(parts[0] ?? '0'), parseInt(parts[1] ?? '0')]
}

/** Format a Date as "YYYY-MM-DD" in local time (not UTC). */
function formatDateLocal(d: Date): string {
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
