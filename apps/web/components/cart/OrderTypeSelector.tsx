'use client'

import { useCartStore } from '@/lib/store/cart'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface OrderTypeSelectorProps {
  lang: SupportedLocale
  dict: Record<string, Record<string, string>>
}

export function OrderTypeSelector({ lang, dict }: OrderTypeSelectorProps) {
  const { orderType, setOrderType } = useCartStore()
  const cartDict = dict['cart'] ?? {}
  const typeDict = (dict['cart'] as unknown as Record<string, Record<string, string>>)?.['orderType'] ?? {}

  return (
    <div>
      <p className="text-sm font-medium text-stone-700 mb-2">{typeDict['label']}</p>
      <div className="flex rounded-xl border border-stone-200 overflow-hidden">
        {(['pickup', 'delivery'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={[
              'flex-1 py-2.5 text-sm font-medium transition-colors',
              orderType === type
                ? 'bg-amber-600 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-50',
            ].join(' ')}
          >
            {type === 'pickup' ? typeDict['pickup'] : typeDict['delivery']}
          </button>
        ))}
      </div>
    </div>
  )
}
