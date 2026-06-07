'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SavedAddress } from '@zakhtsyanka/shared/types'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface AddressManagerProps {
  initialAddresses: SavedAddress[]
  lang: SupportedLocale
}

const EMPTY: Omit<SavedAddress, 'id' | 'customerId'> = {
  label: '', street: '', city: '', postalCode: '', isDefault: false,
}

export function AddressManager({ initialAddresses, lang }: AddressManagerProps) {
  const router   = useRouter()
  const [pending, start] = useTransition()
  const [addresses, setAddresses] = useState(initialAddresses)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const isUk = lang === 'uk'

  const inputBase = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500'

  async function handleAdd() {
    start(async () => {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const newAddr = await res.json() as SavedAddress
        setAddresses((prev) => [...prev, newAddr])
        setForm(EMPTY)
        setShowForm(false)
        router.refresh()
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm(isUk ? 'Видалити адресу?' : 'Delete this address?')) return
    start(async () => {
      await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      router.refresh()
    })
  }

  async function handleSetDefault(id: string) {
    start(async () => {
      await fetch(`/api/account/addresses/${id}/default`, { method: 'POST' })
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Address list */}
      {addresses.map((addr) => (
        <div key={addr.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-stone-900 text-sm">{addr.label}</p>
              {addr.isDefault && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {isUk ? 'Основна' : 'Default'}
                </span>
              )}
            </div>
            <p className="text-sm text-stone-600 mt-0.5">{addr.street}</p>
            <p className="text-sm text-stone-500">{addr.city}, {addr.postalCode}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {!addr.isDefault && (
              <button
                onClick={() => handleSetDefault(addr.id)}
                disabled={pending}
                className="text-xs text-amber-700 hover:underline"
              >
                {isUk ? 'Зробити основною' : 'Set default'}
              </button>
            )}
            <button
              onClick={() => handleDelete(addr.id)}
              disabled={pending}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              {isUk ? 'Видалити' : 'Delete'}
            </button>
          </div>
        </div>
      ))}

      {/* Add form */}
      {showForm ? (
        <div className="bg-white rounded-xl border border-amber-200 p-5 flex flex-col gap-3">
          <h3 className="font-semibold text-stone-900 text-sm">
            {isUk ? 'Нова адреса' : 'New address'}
          </h3>
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder={isUk ? 'Назва (Дім, Робота…)' : 'Label (Home, Work…)'}
            className={inputBase}
          />
          <input
            value={form.street}
            onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
            placeholder={isUk ? 'Вулиця і номер будинку' : 'Street address'}
            className={inputBase}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder={isUk ? 'Місто' : 'City'}
              className={inputBase}
            />
            <input
              value={form.postalCode}
              onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
              placeholder={isUk ? 'Індекс' : 'Postal code'}
              className={inputBase}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="rounded border-stone-300 text-amber-600"
            />
            {isUk ? 'Зробити основною' : 'Set as default'}
          </label>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={pending || !form.label || !form.street || !form.city}
              className="px-5 py-2 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {isUk ? 'Зберегти' : 'Save'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY) }}
              className="px-5 py-2 bg-stone-100 text-stone-700 rounded-full text-sm font-medium hover:bg-stone-200"
            >
              {isUk ? 'Скасувати' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-sm text-stone-400 hover:border-amber-300 hover:text-amber-600 transition-colors"
        >
          + {isUk ? 'Додати адресу' : 'Add address'}
        </button>
      )}
    </div>
  )
}
