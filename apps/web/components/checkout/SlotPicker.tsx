'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { formatDate, formatTime } from '@zakhtsyanka/shared/utils'
import type { TimeSlot } from '@zakhtsyanka/shared/types'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface SlotsByDate {
  [date: string]: TimeSlot[]
}

interface SlotPickerProps {
  lang: SupportedLocale
  dict: Record<string, Record<string, string>>
}

export function SlotPicker({ lang, dict }: SlotPickerProps) {
  const { orderType, fulfillmentSlot, setFulfillmentSlot } = useCartStore()
  const slotDict = (dict['checkout'] as unknown as Record<string, Record<string, string>>)?.['slot'] ?? {}

  const [slotsByDate, setSlotsByDate] = useState<SlotsByDate>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/slots?type=${orderType}&days=7`)
      if (!res.ok) return
      const data = await res.json() as { paused: boolean; slots: SlotsByDate }
      setPaused(data.paused)
      setSlotsByDate(data.slots)
      // Auto-select the first date that has available slots
      const firstAvailableDate = Object.entries(data.slots).find(
        ([, slots]) => slots.some((s) => s.available),
      )?.[0]
      setSelectedDate(firstAvailableDate ?? Object.keys(data.slots)[0] ?? null)
    } finally {
      setLoading(false)
    }
  }, [orderType])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  // Clear the chosen slot when order type changes
  useEffect(() => { setFulfillmentSlot(null) }, [orderType, setFulfillmentSlot])

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 bg-stone-200 rounded" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 w-16 bg-stone-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (paused) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
        {lang === 'uk'
          ? 'Онлайн-замовлення тимчасово призупинено. Спробуйте пізніше.'
          : 'Online orders are temporarily paused. Please try again later.'}
      </div>
    )
  }

  const dates = Object.keys(slotsByDate).sort()
  const slotsForSelectedDate = selectedDate ? (slotsByDate[selectedDate] ?? []) : []

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-stone-700">
        {orderType === 'pickup' ? slotDict['pickupLabel'] : slotDict['deliveryLabel']}
        <span className="text-red-500 ml-0.5">*</span>
      </p>

      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {dates.map((date) => {
          const hasAvailable = slotsByDate[date]?.some((s) => s.available) ?? false
          const d = new Date(date + 'T00:00:00')
          const dayName = d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-UA', { weekday: 'short' })
          const dayNum  = d.getDate()
          const isSelected = date === selectedDate

          return (
            <button
              key={date}
              onClick={() => { setSelectedDate(date); setFulfillmentSlot(null) }}
              disabled={!hasAvailable}
              className={[
                'flex flex-col items-center px-3 py-2 rounded-xl text-xs shrink-0 min-w-[56px] transition-colors',
                isSelected
                  ? 'bg-amber-600 text-white'
                  : hasAvailable
                  ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  : 'bg-stone-50 text-stone-300 cursor-not-allowed',
              ].join(' ')}
            >
              <span className="capitalize">{dayName}</span>
              <span className="font-bold text-base">{dayNum}</span>
            </button>
          )
        })}
      </div>

      {/* Time grid */}
      {selectedDate && (
        <div>
          {slotsForSelectedDate.filter((s) => s.available).length === 0 ? (
            <p className="text-sm text-stone-400">{slotDict['noSlotsAvailable']}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slotsForSelectedDate.map((slot) => {
                const isChosen = fulfillmentSlot === slot.datetime
                return (
                  <button
                    key={slot.datetime}
                    onClick={() => setFulfillmentSlot(isChosen ? null : slot.datetime)}
                    disabled={!slot.available}
                    className={[
                      'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                      isChosen
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : slot.available
                        ? 'bg-white border-stone-300 text-stone-700 hover:border-amber-400'
                        : 'bg-stone-50 border-stone-200 text-stone-300 cursor-not-allowed',
                    ].join(' ')}
                  >
                    {formatTime(slot.datetime, lang)}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
