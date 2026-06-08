'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface GalleryItem {
  id: string
  caption_uk: string
  caption_en: string
  photos: string[]
  tags: string[]
  is_published: boolean
  sort_order: number
}

interface AdminGalleryManagerProps {
  initialItems: GalleryItem[]
}

export function AdminGalleryManager({ initialItems }: AdminGalleryManagerProps) {
  const router  = useRouter()
  const [items, setItems] = useState(initialItems)
  const [pending, start] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    captionUk:   '',
    captionEn:   '',
    photos:      '',   // comma-separated URLs
    tags:        '',   // comma-separated
    isPublished: true,
  })

  const inputBase = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500'

  async function handleAdd() {
    const photos = form.photos.split(',').map((s) => s.trim()).filter(Boolean)
    const tags   = form.tags.split(',').map((s) => s.trim()).filter(Boolean)
    if (!form.captionUk || photos.length === 0) return

    start(async () => {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captionUk: form.captionUk, captionEn: form.captionEn, photos, tags, isPublished: form.isPublished }),
      })
      if (res.ok) {
        const newItem = await res.json() as GalleryItem
        setItems((prev) => [...prev, newItem])
        setForm({ captionUk: '', captionEn: '', photos: '', tags: '', isPublished: true })
        setShowAdd(false)
        router.refresh()
      }
    })
  }

  async function handleToggle(id: string, current: boolean) {
    start(async () => {
      await fetch(`/api/admin/gallery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !current }),
      })
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_published: !current } : i))
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Видалити з галереї?')) return
    start(async () => {
      await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((i) => i.id !== id))
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add button */}
      <button onClick={() => setShowAdd(!showAdd)}
        className="self-start bg-amber-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-amber-700 transition-colors">
        {showAdd ? '✕ Скасувати' : '+ Додати фото'}
      </button>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-stone-900">Нове фото в галерею</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">🇺🇦 Підпис (UK)</label>
              <input value={form.captionUk} onChange={(e) => setForm((f) => ({ ...f, captionUk: e.target.value }))} className={inputBase} placeholder="Весільний торт з квітами" />
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">🇬🇧 Caption (EN)</label>
              <input value={form.captionEn} onChange={(e) => setForm((f) => ({ ...f, captionEn: e.target.value }))} className={inputBase} placeholder="Wedding cake with flowers" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">URL фотографій (через кому)</label>
            <textarea value={form.photos} onChange={(e) => setForm((f) => ({ ...f, photos: e.target.value }))}
              className={`${inputBase} resize-none`} rows={2}
              placeholder="https://supabase.co/storage/..., https://..." />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Теги (через кому)</label>
            <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className={inputBase} placeholder="wedding, floral, custom" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-700">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} className="rounded border-stone-300 text-amber-600" />
            Опублікувати одразу
          </label>
          <button onClick={handleAdd} disabled={pending || !form.captionUk || !form.photos}
            className="self-start bg-amber-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
            {pending ? 'Зберігаємо…' : 'Додати в галерею'}
          </button>
        </div>
      )}

      {/* Items grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className={['bg-white rounded-2xl border overflow-hidden', item.is_published ? 'border-stone-200' : 'border-stone-100 opacity-60'].join(' ')}>
            <div className="relative aspect-[4/3] bg-stone-100">
              {item.photos[0] ? (
                // Use plain <img> in admin so onError fallback works without next/image constraints
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photos[0]}
                  alt={item.caption_uk}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget
                    t.style.display = 'none'
                    const parent = t.parentElement
                    if (parent && !parent.querySelector('.img-fallback')) {
                      const fb = document.createElement('div')
                      fb.className = 'img-fallback absolute inset-0 flex flex-col items-center justify-center text-stone-400 gap-1 text-xs'
                      fb.innerHTML = '<span class="text-3xl">🖼️</span><span>Зображення недоступне</span>'
                      parent.appendChild(fb)
                    }
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl text-stone-300">🖼️</div>
              )}
              {!item.is_published && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <span className="text-xs bg-stone-700 text-white px-2 py-1 rounded-full">Схований</span>
                </div>
              )}
            </div>
            <div className="p-3 flex flex-col gap-2">
              <p className="text-sm font-medium text-stone-900 leading-snug">{item.caption_uk}</p>
              {item.tags.length > 0 && (
                <p className="text-xs text-stone-400">{item.tags.join(', ')}</p>
              )}
              <div className="flex gap-2 mt-1">
                <button onClick={() => handleToggle(item.id, item.is_published)} disabled={pending}
                  className="text-xs px-3 py-1.5 border border-stone-300 rounded-full hover:bg-stone-50 disabled:opacity-50">
                  {item.is_published ? 'Сховати' : 'Опублікувати'}
                </button>
                <button onClick={() => handleDelete(item.id)} disabled={pending}
                  className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-full hover:bg-red-50 disabled:opacity-50">
                  Видалити
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-stone-400 text-sm text-center py-8">Галерея порожня. Додайте перше фото.</p>
      )}
    </div>
  )
}
