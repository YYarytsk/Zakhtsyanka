'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface SettingsFormProps {
  initialPaused: boolean
  initialAnnouncementUk: string
  initialAnnouncementEn: string
  initialLeadPickup: number
  initialLeadDelivery: number
}

export function SettingsForm({
  initialPaused,
  initialAnnouncementUk,
  initialAnnouncementEn,
  initialLeadPickup,
  initialLeadDelivery,
}: SettingsFormProps) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [paused,          setPaused]          = useState(initialPaused)
  const [announcementUk,  setAnnouncementUk]  = useState(initialAnnouncementUk)
  const [announcementEn,  setAnnouncementEn]  = useState(initialAnnouncementEn)
  const [leadPickup,      setLeadPickup]      = useState(initialLeadPickup)
  const [leadDelivery,    setLeadDelivery]    = useState(initialLeadDelivery)

  async function handleSave() {
    setError(null)
    setSaved(false)
    start(async () => {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordersPaused:         paused,
          announcementUk:       announcementUk || null,
          announcementEn:       announcementEn || null,
          leadTimePickupHours:   leadPickup,
          leadTimeDeliveryHours: leadDelivery,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setError(data.error ?? 'Помилка збереження')
      }
    })
  }

  const inputBase = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500'

  return (
    <div className="max-w-xl flex flex-col gap-8">

      {/* Pause toggle — most prominent, at the top */}
      <section className={[
        'rounded-2xl border-2 p-5 flex items-center justify-between gap-4 transition-colors',
        paused ? 'border-red-300 bg-red-50' : 'border-stone-200 bg-white',
      ].join(' ')}>
        <div>
          <p className="font-semibold text-stone-900">Призупинити онлайн-замовлення</p>
          <p className="text-sm text-stone-500 mt-0.5">
            {paused
              ? 'Замовлення зараз призупинені. Клієнти бачать повідомлення.'
              : 'Замовлення приймаються. Вимкніть, якщо пекарня перевантажена.'}
          </p>
        </div>
        <button
          onClick={() => setPaused((v) => !v)}
          aria-pressed={paused}
          className={[
            'relative w-14 h-7 rounded-full transition-colors shrink-0',
            paused ? 'bg-red-500' : 'bg-stone-300',
          ].join(' ')}
        >
          <span className={[
            'absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform',
            paused ? 'translate-x-7' : 'translate-x-0',
          ].join(' ')} />
        </button>
      </section>

      {/* Announcement banner */}
      <section className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-stone-900">Оголошення для клієнтів</h2>
        <p className="text-xs text-stone-400">Відображається у верхній частині сайту. Залиште порожнім, щоб приховати.</p>
        <div>
          <label className="text-xs text-stone-500 mb-1 block">🇺🇦 Українська</label>
          <textarea
            value={announcementUk}
            onChange={(e) => setAnnouncementUk(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Наприклад: Ми не працюємо 24–25 грудня"
            className={`${inputBase} resize-none`}
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 mb-1 block">🇬🇧 English</label>
          <textarea
            value={announcementEn}
            onChange={(e) => setAnnouncementEn(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="e.g. We are closed on December 24–25"
            className={`${inputBase} resize-none`}
          />
        </div>
      </section>

      {/* Lead times */}
      <section className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-stone-900">Час підготовки</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Самовивіз (годин)</label>
            <input
              type="number" min={1} max={72}
              value={leadPickup}
              onChange={(e) => setLeadPickup(parseInt(e.target.value) || 2)}
              className={inputBase}
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Доставка (годин)</label>
            <input
              type="number" min={1} max={168}
              value={leadDelivery}
              onChange={(e) => setLeadDelivery(parseInt(e.target.value) || 24)}
              className={inputBase}
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-6 py-2.5 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {pending ? 'Зберігаємо…' : 'Зберегти'}
        </button>
        {saved && <p className="text-sm text-green-600">✓ Збережено</p>}
      </div>
    </div>
  )
}
