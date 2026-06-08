'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@zakhtsyanka/shared/types'
import { Button } from '@/components/ui/Button'
import { AdminImageUploader } from './AdminImageUploader'

// ── AI draft helper ───────────────────────────────────────────────────────────

async function draftEnglish(nameUk: string, descriptionUk: string) {
  const res = await fetch('/api/admin/ai/translate-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nameUk, descriptionUk }),
  })
  if (!res.ok) return null
  return res.json() as Promise<{ nameEn: string; descriptionEn: string }>
}

// ── Bilingual text field ──────────────────────────────────────────────────────

function BilingualField({
  label,
  fieldUk,
  fieldEn,
  valueUk,
  valueEn,
  onChangeUk,
  onChangeEn,
  multiline = false,
  required = false,
}: {
  label: string
  fieldUk: string
  fieldEn: string
  valueUk: string
  valueEn: string
  onChangeUk: (v: string) => void
  onChangeEn: (v: string) => void
  multiline?: boolean
  required?: boolean
}) {
  const base = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
  const Input = multiline ? 'textarea' : 'input'
  return (
    <div>
      <p className="text-sm font-medium text-stone-700 mb-2">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500 mb-1 block">🇺🇦 Українська</label>
          <Input
            name={fieldUk}
            value={valueUk}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeUk(e.target.value)}
            required={required}
            rows={multiline ? 3 : undefined}
            className={`${base} ${multiline ? 'resize-y min-h-[80px]' : ''}`}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 mb-1 block">🇬🇧 English</label>
          <Input
            name={fieldEn}
            value={valueEn}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeEn(e.target.value)}
            rows={multiline ? 3 : undefined}
            className={`${base} ${multiline ? 'resize-y min-h-[80px]' : ''}`}
            placeholder="Optional — AI draft on save if empty"
          />
        </div>
      </div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

const DIETARY_TAGS = ['vegan', 'vegetarian', 'gluten-free', 'nut-free', 'dairy-free'] as const
const FULFILLMENT_TYPES = ['pickup', 'delivery', 'preorder'] as const

interface ProductFormProps {
  product?: Product
  categories: Array<{ id: string; nameUk: string; nameEn: string }>
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error,       setError]       = useState<string | null>(null)
  const [aiDrafting,  setAiDrafting]  = useState(false)
  const [aiDrafted,   setAiDrafted]   = useState(false)

  const [fields, setFields] = useState({
    nameUk:         product?.nameUk ?? '',
    nameEn:         product?.nameEn ?? '',
    descriptionUk:  product?.descriptionUk ?? '',
    descriptionEn:  product?.descriptionEn ?? '',
    photos:         product?.photos ?? [] as string[],
    allergensUk:    product?.allergensUk ?? '',
    allergensEn:    product?.allergensEn ?? '',
    priceCents:     product?.priceCents ?? 0,
    categoryId:     product?.categoryId ?? (categories[0]?.id ?? ''),
    dietaryTags:    product?.dietaryTags ?? [],
    fulfillmentTypes: product?.fulfillmentTypes ?? ['pickup'],
    dailyCap:       product?.dailyCap ?? null as number | null,
    isAvailable:    product?.isAvailable ?? true,
    slug:           product?.slug ?? '',
  })

  function set<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  function toggleArray<T extends string>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
  }

  async function handleAiDraft() {
    if (!fields.nameUk.trim()) return
    setAiDrafting(true)
    const result = await draftEnglish(fields.nameUk, fields.descriptionUk)
    if (result) {
      setFields((prev) => ({
        ...prev,
        nameEn:        result.nameEn        || prev.nameEn,
        descriptionEn: result.descriptionEn || prev.descriptionEn,
      }))
      setAiDrafted(true)
    }
    setAiDrafting(false)
  }

  function handleSubmit() {
    setError(null)
    if (!fields.nameUk.trim()) { setError('Назва українською обов\'язкова'); return }
    if (fields.priceCents <= 0) { setError('Вкажіть ціну'); return }
    if (fields.fulfillmentTypes.length === 0) { setError('Оберіть спосіб отримання'); return }

    const slug = fields.slug.trim() || fields.nameUk
      .toLowerCase()
      .replace(/[^a-zа-яёії0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 80)

    const body = { ...fields, slug, id: product?.id }

    startTransition(async () => {
      const res = await fetch('/api/admin/products', {
        method: product ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setError(data.error ?? 'Помилка збереження')
        return
      }
      router.push('/admin/catalog' as any)
      router.refresh()
    })
  }

  const inputBase = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500'

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col gap-6">

        {/* Names */}
        <BilingualField
          label="Назва товару"
          fieldUk="nameUk" fieldEn="nameEn"
          valueUk={fields.nameUk} valueEn={fields.nameEn}
          onChangeUk={(v) => set('nameUk', v)}
          onChangeEn={(v) => set('nameEn', v)}
          required
        />

        {/* AI draft button — appears after Ukrainian name is entered */}
        {fields.nameUk && (!fields.nameEn || !fields.descriptionEn) && (
          <div className="flex items-center gap-3 -mt-2">
            <button
              type="button"
              onClick={handleAiDraft}
              disabled={aiDrafting}
              className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              {aiDrafting ? '⏳ Генеруємо…' : '✨ Чернетка EN (AI)'}
            </button>
            {aiDrafted && (
              <span className="text-xs text-stone-400">
                Перевірте і відредагуйте перед збереженням
              </span>
            )}
          </div>
        )}

        {/* Descriptions */}
        <BilingualField
          label="Опис"
          fieldUk="descriptionUk" fieldEn="descriptionEn"
          valueUk={fields.descriptionUk} valueEn={fields.descriptionEn}
          onChangeUk={(v) => set('descriptionUk', v)}
          onChangeEn={(v) => set('descriptionEn', v)}
          multiline
        />

        {/* Allergens — mandatory human review, never AI-generated */}
        <BilingualField
          label="Алергени та склад (завжди вводяться вручну — не AI)"
          fieldUk="allergensUk" fieldEn="allergensEn"
          valueUk={fields.allergensUk ?? ''} valueEn={fields.allergensEn ?? ''}
          onChangeUk={(v) => set('allergensUk', v)}
          onChangeEn={(v) => set('allergensEn', v)}
          multiline
        />

        {/* Photos */}
        <div>
          <label className="text-sm font-medium text-stone-700 mb-2 block">Фотографії товару</label>
          <AdminImageUploader
            bucket="product-photos"
            value={fields.photos}
            onChange={(urls) => set('photos', urls)}
            maxFiles={8}
            maxSizeMb={8}
            label="Завантажити фото продукту"
          />
        </div>

        {/* Price + category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-stone-700 mb-1 block">
              Ціна (грн)<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={fields.priceCents / 100}
              onChange={(e) => set('priceCents', Math.round(parseFloat(e.target.value || '0') * 100))}
              className={inputBase}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700 mb-1 block">Категорія</label>
            <select
              value={fields.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className={inputBase}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameUk} / {c.nameEn}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dietary tags */}
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">Дієтичні мітки</p>
          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => {
              const active = fields.dietaryTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => set('dietaryTags', toggleArray(fields.dietaryTags as any[], tag) as any)}
                  className={[
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    active ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-stone-300 text-stone-600',
                  ].join(' ')}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Fulfillment types */}
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">
            Спосіб отримання<span className="text-red-500">*</span>
          </p>
          <div className="flex gap-3">
            {FULFILLMENT_TYPES.map((type) => {
              const active = fields.fulfillmentTypes.includes(type)
              const labels = { pickup: 'Самовивіз', delivery: 'Доставка', preorder: 'Передзамовлення' }
              return (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => set('fulfillmentTypes', toggleArray(fields.fulfillmentTypes as any[], type) as any)}
                    className="rounded border-stone-300 text-amber-600"
                  />
                  <span className="text-sm text-stone-700">{labels[type]}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Daily cap + availability */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-stone-700 mb-1 block">
              Денний ліміт (порожньо = без ліміту)
            </label>
            <input
              type="number"
              min={1}
              value={fields.dailyCap ?? ''}
              onChange={(e) => set('dailyCap', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Без ліміту"
              className={inputBase}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={fields.isAvailable}
                onChange={(e) => set('isAvailable', e.target.checked)}
                className="rounded border-stone-300 text-amber-600 h-4 w-4"
              />
              <span className="text-sm font-medium text-stone-700">Товар доступний</span>
            </label>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} loading={pending}>
            {product ? 'Зберегти зміни' : 'Додати товар'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/admin/catalog' as any)}
          >
            Скасувати
          </Button>
        </div>
      </div>
    </div>
  )
}
