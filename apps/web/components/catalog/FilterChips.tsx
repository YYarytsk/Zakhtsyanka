'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface FilterOption {
  key: string
  label: string
}

interface FilterChipsProps {
  options: FilterOption[]
  activeKeys: string[]
  paramName: string
  lang: SupportedLocale
}

export function FilterChips({ options, activeKeys, paramName, lang }: FilterChipsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function toggle(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.getAll(paramName)
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key]

    params.delete(paramName)
    next.forEach((k) => params.append(paramName, k))

    const qs = params.toString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push((qs ? `${pathname}?${qs}` : pathname) as any, { scroll: false })
  }

  return (
    <div className="flex gap-2 flex-wrap" role="group">
      {options.map(({ key, label }) => {
        const active = activeKeys.includes(key)
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            aria-pressed={active}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              active
                ? 'bg-amber-600 border-amber-600 text-white'
                : 'bg-white border-stone-300 text-stone-600 hover:border-amber-400',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
