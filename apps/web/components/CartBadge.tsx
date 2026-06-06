'use client'

import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface CartBadgeProps {
  lang: SupportedLocale
  label: string
}

export function CartBadge({ lang, label }: CartBadgeProps) {
  const count = useCartStore((s) => s.itemCount())

  return (
    <Link
      href={`/${lang}/cart` as any}
      className="relative px-3 py-1.5 rounded hover:bg-stone-100 transition-colors text-sm font-medium text-stone-700"
    >
      {label}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
