'use client'

import Image from 'next/image'
import { useCartStore, type CartItem } from '@/lib/store/cart'
import { formatPrice } from '@zakhtsyanka/shared/utils'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface CartItemRowProps {
  item: CartItem
  lang: SupportedLocale
  dict: Record<string, string>
}

export function CartItemRow({ item, lang, dict }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCartStore()
  const name = lang === 'uk' ? item.nameUk : item.nameEn
  const lineTotal = formatPrice(item.priceCents * item.quantity, lang)

  return (
    <div className="flex items-center gap-4 py-4 border-b border-stone-100 last:border-0">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
        {item.photo ? (
          <Image src={item.photo} alt={name} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🥐</div>
        )}
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-900 truncate">{name}</p>
        <p className="text-sm text-stone-500">{formatPrice(item.priceCents, lang)}</p>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
          aria-label={dict['quantity'] ?? 'Quantity'}
          className="w-7 h-7 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 flex items-center justify-center text-lg leading-none transition-colors"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
          aria-label={dict['quantity'] ?? 'Quantity'}
          className="w-7 h-7 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 flex items-center justify-center text-lg leading-none transition-colors"
        >
          +
        </button>
      </div>

      {/* Line total */}
      <p className="w-20 text-right font-semibold text-stone-900 shrink-0">{lineTotal}</p>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.productId)}
        aria-label={dict['remove'] ?? 'Remove'}
        className="text-stone-300 hover:text-red-400 transition-colors shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
