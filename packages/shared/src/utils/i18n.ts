import type { Locale } from '../types/index.js'

type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

// Ukrainian plural rules per CLDR
function getPluralCategory(n: number, locale: Locale): PluralCategory {
  if (locale !== 'uk') {
    // English: one | other
    return n === 1 ? 'one' : 'other'
  }
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'one'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'few'
  return 'many'
}

// Parse a plural block: "one {x item} few {x items} many {x items} other {x items}"
function parsePluralBlock(block: string, count: number, locale: Locale): string {
  const category = getPluralCategory(count, locale)
  const categoryOrder: PluralCategory[] = [category, 'other']
  for (const cat of categoryOrder) {
    const match = block.match(new RegExp(`${cat}\\s*\\{([^}]*)\\}`))
    if (match?.[1] !== undefined) {
      return match[1].replace(/#/g, String(count))
    }
  }
  return String(count)
}

// ICU MessageFormat subset: handles {var} substitution and {count, plural, ...}
export function formatMessage(
  template: string,
  values: Record<string, string | number> = {},
  locale: Locale = 'uk',
): string {
  return template.replace(/\{([^}]+)\}/g, (match, inner: string) => {
    const parts = inner.split(',').map((s) => s.trim())
    const key = parts[0] ?? ''

    // Plural: {count, plural, one {...} few {...} many {...} other {...}}
    if (parts[1] === 'plural' && parts.length >= 3) {
      const count = Number(values[key] ?? 0)
      const block = parts.slice(2).join(',')
      return parsePluralBlock(block, count, locale)
    }

    // Simple substitution: {varName}
    const value = key in values ? values[key] : undefined
    return value !== undefined ? String(value) : match
  })
}
