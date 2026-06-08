'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface CartBadgeProps {
  lang: SupportedLocale
  label: string
}

export function CartBadge({ lang, label }: CartBadgeProps) {
  const count = useCartStore((s) => s.itemCount())

  // Delay badge rendering until after hydration.
  // The server has no localStorage, so count is always 0 on the server.
  // Without this guard the server renders no badge but the client immediately
  // shows one → hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <Link
      href={`/${lang}/cart` as any}
      className="relative px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors text-sm font-medium text-stone-600 hover:text-stone-900"
    >
      {label}
      {mounted && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
