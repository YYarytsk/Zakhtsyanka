'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function SeedButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleSeed() {
    if (!confirm('Load 18 sample products and gallery photos? This only works on an empty catalog.')) return
    start(async () => {
      const res  = await fetch('/api/admin/seed', { method: 'POST' })
      const data = await res.json() as { ok?: boolean; message?: string; error?: string }
      setMsg({ text: data.message ?? data.error ?? 'Done', ok: res.ok })
      if (res.ok) router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSeed}
        disabled={pending}
        className="px-4 py-2 text-sm border border-stone-300 rounded-full text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
      >
        {pending ? '⏳ Loading…' : '🌱 Load sample data'}
      </button>
      {msg && (
        <p className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>
      )}
    </div>
  )
}
