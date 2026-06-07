'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface PhotoUploaderProps {
  photos: string[]
  onChange: (urls: string[]) => void
  lang: 'uk' | 'en'
  hint?: string
  maxPhotos?: number
}

export function PhotoUploader({ photos, onChange, lang, hint, maxPhotos = 3 }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isUk = lang === 'uk'

  async function handleFiles(files: FileList) {
    setError(null)
    if (photos.length + files.length > maxPhotos) {
      setError(isUk ? `Максимум ${maxPhotos} фото` : `Maximum ${maxPhotos} photos`)
      return
    }

    setUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError(isUk ? 'Кожне фото не більше 5 МБ' : 'Each photo must be under 5 MB')
        continue
      }
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('custom-request-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadErr) {
        setError(uploadErr.message)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('custom-request-photos')
        .getPublicUrl(path)
      newUrls.push(publicUrl)
    }

    onChange([...photos, ...newUrls])
    setUploading(false)
  }

  function handleRemove(url: string) {
    onChange(photos.filter((p) => p !== url))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Preview grid */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url) => (
            <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden bg-stone-100 group">
              <Image src={url} alt="Reference" fill className="object-cover" sizes="96px" />
              <button
                onClick={() => handleRemove(url)}
                className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xl"
                type="button"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload trigger */}
      {photos.length < maxPhotos && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 border-2 border-dashed border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-500 hover:border-amber-400 hover:text-amber-600 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <><span className="animate-spin">⏳</span> {isUk ? 'Завантаження…' : 'Uploading…'}</>
            ) : (
              <><span>📷</span> {hint ?? (isUk ? 'Додати фото' : 'Add photo')}</>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
