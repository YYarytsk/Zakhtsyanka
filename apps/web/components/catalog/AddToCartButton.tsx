'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useCartStore } from '@/lib/store/cart'
import type { FulfillmentType } from '@zakhtsyanka/shared/types'

interface AddToCartButtonProps {
  productId: string
  slug: string
  nameUk: string
  nameEn: string
  priceCents: number
  photo: string | null
  fulfillmentTypes: FulfillmentType[]
  label: string
}

export function AddToCartButton({
  productId, slug, nameUk, nameEn, priceCents, photo, fulfillmentTypes, label,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)

  function handleClick() {
    addItem({ productId, slug, nameUk, nameEn, priceCents, photo, fulfillmentTypes })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Button size="lg" className="w-full sm:w-auto" onClick={handleClick}>
      {added ? '✓' : label}
    </Button>
  )
}
