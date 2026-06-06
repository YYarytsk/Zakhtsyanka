'use client'

import { useState, useEffect, useRef } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { formatPrice } from '@zakhtsyanka/shared/utils'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface DeliveryAddressFormProps {
  lang: SupportedLocale
  dict: Record<string, Record<string, string>>
}

export function DeliveryAddressForm({ lang, dict }: DeliveryAddressFormProps) {
  const { deliveryAddress, setDeliveryAddress, setDeliveryFee } = useCartStore()
  const deliveryDict = (dict['checkout'] as unknown as Record<string, Record<string, string>>)?.['delivery'] ?? {}

  const [street,     setStreet]     = useState(deliveryAddress?.street ?? '')
  const [city,       setCity]       = useState(deliveryAddress?.city ?? '')
  const [postalCode, setPostalCode] = useState(deliveryAddress?.postalCode ?? '')
  const [zoneError,  setZoneError]  = useState<string | null>(null)
  const [fee,        setFee]        = useState<number | null>(null)
  const validateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Validate postal code with debounce whenever it changes
  useEffect(() => {
    if (validateTimer.current) clearTimeout(validateTimer.current)
    if (!postalCode.trim()) {
      setZoneError(null)
      setFee(null)
      setDeliveryFee(0)
      setDeliveryAddress(null)
      return
    }

    validateTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/delivery/validate?postalCode=${encodeURIComponent(postalCode)}`)
        const data = await res.json() as { valid: boolean; feeCents: number }
        if (data.valid) {
          setZoneError(null)
          setFee(data.feeCents)
          setDeliveryFee(data.feeCents)
          if (street && city) {
            setDeliveryAddress({ street, city, postalCode })
          }
        } else {
          setZoneError(deliveryDict['outOfZone'] ?? '')
          setFee(null)
          setDeliveryFee(0)
          setDeliveryAddress(null)
        }
      } catch {
        // silently ignore network errors during validation
      }
    }, 500)

    return () => { if (validateTimer.current) clearTimeout(validateTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode])

  // Sync full address when all fields are filled
  useEffect(() => {
    if (street && city && postalCode && fee !== null) {
      setDeliveryAddress({ street, city, postalCode })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [street, city])

  const inputBase = 'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors'
  const inputOk   = 'border-stone-300 focus:border-amber-500 focus:ring-amber-500'
  const inputErr  = 'border-red-300 focus:border-red-500 focus:ring-red-400 bg-red-50'

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-stone-700">
        {deliveryDict['addressLabel']}
        <span className="text-red-500 ml-0.5">*</span>
      </p>

      <input
        value={street}
        onChange={(e) => setStreet(e.target.value)}
        placeholder={deliveryDict['street']}
        className={`${inputBase} ${inputOk}`}
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={deliveryDict['city']}
          className={`${inputBase} ${inputOk}`}
        />
        <div>
          <input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder={deliveryDict['postalCode']}
            className={`${inputBase} ${zoneError ? inputErr : inputOk}`}
          />
          {zoneError && (
            <p className="text-xs text-red-600 mt-1">{zoneError}</p>
          )}
          {fee !== null && !zoneError && (
            <p className="text-xs text-green-700 mt-1">
              {(deliveryDict['fee'] ?? '{fee}').replace('{fee}', formatPrice(fee, lang))}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
