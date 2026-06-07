'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface ProfileSettingsProps {
  lang: SupportedLocale
  initialBirthday: string | null
  initialLanguage: string
}

export function ProfileSettings({ lang, initialBirthday, initialLanguage }: ProfileSettingsProps) {
  const isUk = lang === 'uk'
  const router = useRouter()
  const [pending, start] = useTransition()
  const [saved,   setSaved] = useState(false)
  const [birthday, setBirthday] = useState(initialBirthday ?? '')
  const [prefLang, setPrefLang] = useState(initialLanguage)

  async function handleSave() {
    start(async () => {
      await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthdayDate:      birthday || null,
          preferredLanguage: prefLang,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    })
  }

  const inputBase = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500'

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-4">
      <h2 className="font-semibold text-stone-900 text-sm">
        {isUk ? 'Профіль' : 'Profile'}
      </h2>

      <div>
        <label className="text-xs font-medium text-stone-600 mb-1 block">
          {isUk ? '🎂 День народження (для бонусних балів)' : '🎂 Birthday (for loyalty bonus)'}
        </label>
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className={inputBase}
        />
        <p className="text-xs text-stone-400 mt-1">
          {isUk
            ? `${50} балів у день народження`
            : `${50} points on your birthday`}
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-stone-600 mb-1 block">
          {isUk ? 'Мова інтерфейсу' : 'Interface language'}
        </label>
        <select value={prefLang} onChange={(e) => setPrefLang(e.target.value)} className={inputBase}>
          <option value="uk">Українська</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-5 py-2 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? '…' : (isUk ? 'Зберегти' : 'Save')}
        </button>
        {saved && <p className="text-sm text-green-600">✓</p>}
      </div>
    </div>
  )
}
