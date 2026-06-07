'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PhotoUploader } from './PhotoUploader'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface RequestFormProps {
  lang: SupportedLocale
  dict: Record<string, Record<string, string>>
  isLoggedIn: boolean
}

export function RequestForm({ lang, dict, isLoggedIn }: RequestFormProps) {
  const router   = useRouter()
  const [pending, start] = useTransition()
  const isUk = lang === 'uk'
  const d = dict['customRequest'] ?? {}
  const formD = (dict['customRequest'] as unknown as Record<string, Record<string, string>>)?.['form'] ?? {}

  const [step,          setStep]          = useState(1)
  const [photos,        setPhotos]        = useState<string[]>([])
  const [guestEmail,    setGuestEmail]    = useState('')
  const [error,         setError]         = useState<string | null>(null)

  const [fields, setFields] = useState({
    occasion:      '',
    servings:      12,
    flavors:       '',
    dietaryNeeds:  '',
    dateNeeded:    '',
    budgetCents:   '',
    notes:         '',
  })

  function set<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((p) => ({ ...p, [key]: value }))
  }

  const inputBase = 'w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
  const textareaBase = `${inputBase} resize-none min-h-[80px]`

  async function handleSubmit() {
    setError(null)
    if (!fields.occasion.trim() || !fields.flavors.trim() || !fields.dateNeeded) {
      setError(isUk ? 'Заповніть обов\'язкові поля' : 'Fill in required fields')
      return
    }
    if (!isLoggedIn && !guestEmail) {
      setError(isUk ? 'Вкажіть email' : 'Email is required')
      return
    }

    start(async () => {
      const res = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion:         fields.occasion,
          servings:         fields.servings,
          flavors:          fields.flavors,
          dietaryNeeds:     fields.dietaryNeeds || null,
          dateNeeded:       fields.dateNeeded,
          referencePhotos:  photos,
          budgetCents:      fields.budgetCents ? Math.round(parseFloat(fields.budgetCents) * 100) : null,
          notes:            fields.notes || null,
          guestEmail:       isLoggedIn ? null : guestEmail,
          customerLanguage: lang,
        }),
      })

      if (!res.ok) {
        setError(isUk ? 'Помилка відправлення. Спробуйте ще раз.' : 'Submission failed. Please try again.')
        return
      }

      const data = await res.json() as { id: string }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`/${lang}/custom-order/${data.id}` as any)
    })
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const step1 = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">
          {formD['occasion']}<span className="text-red-500">*</span>
        </label>
        <input value={fields.occasion} onChange={(e) => set('occasion', e.target.value)}
          placeholder={formD['occasionPlaceholder']} className={inputBase} />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">
          {formD['servings']}<span className="text-red-500">*</span>
        </label>
        <input type="number" min={1} max={500} value={fields.servings}
          onChange={(e) => set('servings', parseInt(e.target.value) || 1)} className={inputBase} />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">
          {formD['dateNeeded']}<span className="text-red-500">*</span>
        </label>
        <input type="date" value={fields.dateNeeded} min={new Date().toISOString().slice(0,10)}
          onChange={(e) => set('dateNeeded', e.target.value)} className={inputBase} />
      </div>
    </div>
  )

  // ── Step 2 ────────────────────────────────────────────────────────────────
  const step2 = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">
          {formD['flavors']}<span className="text-red-500">*</span>
        </label>
        <textarea value={fields.flavors} onChange={(e) => set('flavors', e.target.value)}
          placeholder={formD['flavorsPlaceholder']} className={textareaBase} />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">{formD['dietaryNeeds']}</label>
        <input value={fields.dietaryNeeds} onChange={(e) => set('dietaryNeeds', e.target.value)}
          placeholder={formD['dietaryNeedsPlaceholder']} className={inputBase} />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">{formD['budget']}</label>
        <input type="number" min={0} step={100} value={fields.budgetCents}
          onChange={(e) => set('budgetCents', e.target.value)}
          placeholder={formD['budgetPlaceholder']} className={inputBase} />
      </div>
    </div>
  )

  // ── Step 3 ────────────────────────────────────────────────────────────────
  const step3 = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">{formD['notes']}</label>
        <textarea value={fields.notes} onChange={(e) => set('notes', e.target.value)}
          placeholder={formD['notesPlaceholder']} className={textareaBase} rows={4} />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">{formD['photos']}</label>
        <PhotoUploader photos={photos} onChange={setPhotos} lang={lang} hint={formD['photosHint']} />
      </div>
      {!isLoggedIn && (
        <div>
          <label className="text-sm font-medium text-stone-700 mb-1.5 block">
            Email<span className="text-red-500">*</span>
          </label>
          <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="your@email.com" className={inputBase} />
        </div>
      )}
    </div>
  )

  const steps = [step1, step2, step3]
  const stepLabels = isUk
    ? ['Деталі', 'Смаки', 'Фото і нотатки']
    : ['Details', 'Flavors', 'Photos & notes']

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step - 1 && setStep(i + 1)}
              className={[
                'w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors',
                i + 1 === step
                  ? 'bg-amber-600 text-white'
                  : i + 1 < step
                  ? 'bg-green-500 text-white cursor-pointer'
                  : 'bg-stone-200 text-stone-400',
              ].join(' ')}
            >
              {i + 1 < step ? '✓' : i + 1}
            </button>
            <span className={`text-xs hidden sm:block ${i + 1 === step ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>
              {label}
            </span>
            {i < stepLabels.length - 1 && <div className="flex-1 h-px bg-stone-200 w-4 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        {steps[step - 1]}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button type="button" onClick={() => setStep(step - 1)}
            className="px-5 py-2.5 bg-stone-100 text-stone-700 rounded-full text-sm font-medium hover:bg-stone-200">
            ←
          </button>
        )}
        {step < 3 ? (
          <button type="button" onClick={() => setStep(step + 1)}
            disabled={step === 1 && (!fields.occasion || !fields.dateNeeded)}
            className="flex-1 py-2.5 bg-amber-600 text-white rounded-full text-sm font-semibold hover:bg-amber-700 disabled:opacity-40">
            {isUk ? 'Далі →' : 'Next →'}
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={pending}
            className="flex-1 py-2.5 bg-amber-600 text-white rounded-full text-sm font-semibold hover:bg-amber-700 disabled:opacity-50">
            {pending ? '…' : (formD['submit'])}
          </button>
        )}
      </div>
    </div>
  )
}
