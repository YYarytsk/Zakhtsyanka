import type { DietaryTag } from '@zakhtsyanka/shared/types'

const TAG_STYLES: Record<DietaryTag, { label: { uk: string; en: string }; className: string }> = {
  vegan:       { label: { uk: 'Веганське', en: 'Vegan' },       className: 'bg-green-100 text-green-800' },
  vegetarian:  { label: { uk: 'Вегетаріанське', en: 'Veg' },   className: 'bg-lime-100 text-lime-800' },
  'gluten-free': { label: { uk: 'Без глютену', en: 'GF' },     className: 'bg-yellow-100 text-yellow-800' },
  'nut-free':  { label: { uk: 'Без горіхів', en: 'NF' },       className: 'bg-orange-100 text-orange-800' },
  'dairy-free': { label: { uk: 'Без лактози', en: 'DF' },      className: 'bg-sky-100 text-sky-800' },
}

interface DietaryBadgeProps {
  tag: DietaryTag
  lang: 'uk' | 'en'
  compact?: boolean
}

export function DietaryBadge({ tag, lang, compact = false }: DietaryBadgeProps) {
  const style = TAG_STYLES[tag]
  if (!style) return null
  const label = compact
    ? tag.toUpperCase().slice(0, 2)
    : style.label[lang]

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}>
      {label}
    </span>
  )
}
