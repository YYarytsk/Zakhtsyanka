'use client'

import { Button } from '@/components/ui/Button'

interface AddToCartButtonProps {
  productId: string
  label: string
}

export function AddToCartButton({ productId, label }: AddToCartButtonProps) {
  // Cart store will be wired in Phase 1-B
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleClick() {
    console.log('add to cart', productId)
  }

  return (
    <Button size="lg" className="w-full sm:w-auto" onClick={handleClick}>
      {label}
    </Button>
  )
}
