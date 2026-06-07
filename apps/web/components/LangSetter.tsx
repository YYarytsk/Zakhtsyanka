'use client'

import { useEffect } from 'react'

// Sets document.documentElement.lang on the client after hydration.
// Replaces the <script dangerouslySetInnerHTML> approach which triggers a
// React warning about scripts inside components never executing on the client.
export function LangSetter({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return null
}
