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

interface FormState {
  captionUk:   string
  captionEn:   string
  photos:      string
  tags:        string
  isPublished: boolean
}

const emptyForm: FormState = { captionUk: '', captionEn: '', photos: '', tags: '', isPublished: true }

export function AdminGalleryManager({ initialItems }: AdminGalleryManagerProps) {
  const router   = useRouter()
  const [items,    setItems]    = useState(initialItems)
  const [pending,  start]       = useTransition()
  const [showAdd,  setShowAdd]  = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [form,     setForm]     = useState<FormState>(emptyForm)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)

  const inputBase = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500'

  // ── Add ─────────────────────────────────────────────────────────────────
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
        setForm(emptyForm)
        setShowAdd(false)
        router.refresh()
      }
    })
  }

  // ── Edit ─────────────────────────────────────────────────────────────────
  function openEdit(item: GalleryItem) {
    setEditId(item.id)
    setEditForm({
      captionUk:   item.caption_uk,
      captionEn:   item.caption_en,
      photos:      item.photos.join(', '),
      tags:        item.tags.join(', '),
      isPublished: item.is_published,
    })
    setShowAdd(false)
  }

  function cancelEdit() { setEditId(null) }

  async function handleSaveEdit(id: string) {
    const photos = editForm.photos.split(',').map((s) => s.trim()).filter(Boolean)
    const tags   = editForm.tags.split(',').map((s) => s.trim()).filter(Boolean)
    if (!editForm.captionUk || photos.length === 0) return

    start(async () => {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captionUk:   editForm.captionUk,
          captionEn:   editForm.captionEn,
          tags,
          isPublished: editForm.isPublished,
        }),
      })
      if (res.ok) {
        setItems((prev) => prev.map((i) =>
          i.id === id
            ? { ...i, caption_uk: editForm.captionUk, caption_en: editForm.captionEn, photos, tags, is_published: editForm.isPublished }
            : i,
        ))
        setEditId(null)
        router.refresh()
      }
    })
  }

  // ── Toggle / Delete ───────────────────────────────────────────────────────
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

  // ── Reusable form fields ──────────────────────────────────────────────────
  function FormFields({ f, setF }: { f: FormState; setF: React.Dispatch<React.SetStateAction<FormState>> }) {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">🇺🇦 Підпис (UK) *</label>
            <input value={f.captionUk} onChange={(e) => setF((p) => ({ ...p, captionUk: e.target.value }))}
              className={inputBase} placeholder="Весільний торт з квітами" />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">🇬🇧 Caption (EN)</label>
            <input value={f.captionEn} onChange={(e) => setF((p) => ({ ...p, captionEn: e.target.value }))}
              className={inputBase} placeholder="Wedding cake with flowers" />
          </div>
        </div>
        <div>
          <label className="text-xs text-stone-500 mb-1 block">URL фотографій (через кому) *</label>
          <textarea value={f.photos} onChange={(e) => setF((p) => ({ ...p, photos: e.target.value }))}
            className={`${inputBase} resize-y min-h-[64px]`} rows={2}
            placeholder="https://…, https://…" />
        </div>
        <div>
          <label className="text-xs text-stone-500 mb-1 block">Теги (через кому)</label>
          <input value={f.tags} onChange={(e) => setF((p) => ({ ...p, tags: e.target.value }))}
            className={inputBase} placeholder="wedding, floral, custom" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-700 select-none">
          <input type="checkbox" checked={f.isPublished}
            onChange={(e) => setF((p) => ({ ...p, isPublished: e.target.checked }))}
            className="rounded border-stone-300 text-amber-600 h-4 w-4" />
          Опублікована
        </label>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Add button ───────────────────────────────────────────────────── */}
      <button
        onClick={() => { setShowAdd(!showAdd); setEditId(null) }}
        className="self-start bg-amber-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-amber-700 transition-colors"
      >
        {showAdd ? '✕ Скасувати' : '+ Додати фото'}
      </button>

      {/* ── Add form ─────────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-stone-900">Нова галерейна картка</h2>
          <FormFields f={form} setF={setForm} />
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={pending || !form.captionUk || !form.photos}
              className="px-6 py-2 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
              {pending ? 'Зберігаємо…' : 'Додати'}
            </button>
            <button onClick={() => { setShowAdd(false); setForm(emptyForm) }}
              className="px-6 py-2 bg-stone-100 text-stone-600 rounded-full text-sm font-medium hover:bg-stone-200">
              Скасувати
            </button>
          </div>
        </div>
      )}

      {/* ── Items grid ───────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className={[
            'bg-white rounded-2xl border overflow-hidden transition-shadow',
            editId === item.id ? 'border-amber-300 shadow-md' : item.is_published ? 'border-stone-200' : 'border-stone-100 opacity-60',
          ].join(' ')}>

            {/* Photo */}
            <div className="relative aspect-[4/3] bg-stone-100">
              {item.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photos[0]}
                  alt={item.caption_uk}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget
                    t.style.display = 'none'
                    const p = t.parentElement
                    if (p && !p.querySelector('.img-fallback')) {
                      const fb = document.createElement('div')
                      fb.className = 'img-fallback absolute inset-0 flex flex-col items-center justify-center text-stone-400 gap-1 text-xs'
                      fb.innerHTML = '<span class="text-3xl">🖼️</span><span>Зображення недоступне</span>'
                      p.appendChild(fb)
                    }
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl text-stone-300">🖼️</div>
              )}
              {!item.is_published && editId !== item.id && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <span className="text-xs bg-stone-700 text-white px-2 py-1 rounded-full">Схований</span>
                </div>
              )}
            </div>

            {/* Edit form (inline) */}
            {editId === item.id ? (
              <div className="p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Редагування</p>
                <FormFields f={editForm} setF={setEditForm} />
                <div className="flex gap-2 pt-1">
                  <button onClick={() => handleSaveEdit(item.id)} disabled={pending || !editForm.captionUk}
                    className="px-5 py-1.5 bg-amber-600 text-white rounded-full text-xs font-semibold hover:bg-amber-700 disabled:opacity-50">
                    {pending ? '…' : '✓ Зберегти'}
                  </button>
                  <button onClick={cancelEdit}
                    className="px-5 py-1.5 bg-stone-100 text-stone-600 rounded-full text-xs font-medium hover:bg-stone-200">
                    Скасувати
                  </button>
                </div>
              </div>
            ) : (
              /* Normal view */
              <div className="p-3 flex flex-col gap-2">
                <p className="text-sm font-medium text-stone-900 leading-snug">{item.caption_uk}</p>
                {item.caption_en && (
                  <p className="text-xs text-stone-500 italic leading-snug">{item.caption_en}</p>
                )}
                {item.tags.length > 0 && (
                  <p className="text-xs text-stone-400">{item.tags.join(', ')}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-1">
                  <button onClick={() => openEdit(item)} disabled={pending}
                    className="text-xs px-3 py-1.5 border border-amber-300 text-amber-700 rounded-full hover:bg-amber-50 disabled:opacity-50 transition-colors">
                    ✏️ Редагувати
                  </button>
                  <button onClick={() => handleToggle(item.id, item.is_published)} disabled={pending}
                    className="text-xs px-3 py-1.5 border border-stone-300 rounded-full hover:bg-stone-50 disabled:opacity-50 transition-colors">
                    {item.is_published ? 'Сховати' : 'Опублікувати'}
                  </button>
                  <button onClick={() => handleDelete(item.id)} disabled={pending}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-full hover:bg-red-50 disabled:opacity-50 transition-colors">
                    Видалити
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-stone-400 text-sm text-center py-8">Галерея порожня. Додайте перше фото.</p>
      )}
    </div>
  )
}
