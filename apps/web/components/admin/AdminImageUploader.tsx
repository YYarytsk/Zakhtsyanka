'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AdminImageUploaderProps {
  bucket: string          // Supabase Storage bucket name
  folder?: string         // optional subfolder inside the bucket
  value: string[]         // current URLs
  onChange: (urls: string[]) => void
  maxFiles?: number
  maxSizeMb?: number
  label?: string
}

export function AdminImageUploader({
  bucket,
  folder = '',
  value,
  onChange,
  maxFiles = 5,
  maxSizeMb = 10,
  label = 'Завантажити фото',
}: AdminImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [dragging,  setDragging]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFiles(files: File[]) {
    setError(null)

    const remaining = maxFiles - value.length
    if (files.length > remaining) {
      setError(`Максимум ${maxFiles} фото. Можна додати ще ${remaining}.`)
      return
    }

    const oversized = files.find((f) => f.size > maxSizeMb * 1024 * 1024)
    if (oversized) {
      setError(`Файл "${oversized.name}" перевищує ${maxSizeMb} МБ.`)
      return
    }

    const invalid = files.find((f) => !f.type.startsWith('image/'))
    if (invalid) {
      setError(`Файл "${invalid.name}" не є зображенням.`)
      return
    }

    setUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []

    for (const file of files) {
      const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = folder ? `${folder}/${name}` : name

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: '31536000', upsert: false })

      if (uploadErr) {
        setError(`Помилка завантаження "${file.name}": ${uploadErr.message}`)
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      newUrls.push(publicUrl)
    }

    onChange([...value, ...newUrls])
    setUploading(false)
  }

  async function handleRemove(url: string) {
    // Extract the path from the URL to delete from storage
    try {
      const supabase = createClient()
      const urlObj = new URL(url)
      // Supabase public URL format: /storage/v1/object/public/{bucket}/{path}
      const pathMatch = urlObj.pathname.match(/\/object\/public\/[^/]+\/(.+)/)
      if (pathMatch?.[1]) {
        await supabase.storage.from(bucket).remove([decodeURIComponent(pathMatch[1])])
      }
    } catch {
      // Silently ignore delete errors — URL still gets removed from list
    }
    onChange(value.filter((u) => u !== url))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (files.length) uploadFiles(files)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, bucket, folder, maxFiles, maxSizeMb])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  return (
    <div className="flex flex-col gap-3">
      {/* Preview grid */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, i) => (
            <div key={url} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute inset-0 bg-stone-900/60 text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Видалити"
              >
                ✕
              </button>
              {/* Order badge */}
              <span className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {value.length < maxFiles && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={[
            'border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
            dragging
              ? 'border-amber-400 bg-amber-50'
              : 'border-stone-300 bg-stone-50 hover:border-amber-400 hover:bg-amber-50',
            uploading ? 'pointer-events-none opacity-60' : '',
          ].join(' ')}
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-stone-500">Завантаження…</p>
            </>
          ) : (
            <>
              <div className="text-3xl">📁</div>
              <div className="text-center">
                <p className="text-sm font-medium text-stone-700">{label}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Перетягніть або натисніть · до {maxSizeMb} МБ кожне · max {maxFiles} фото
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            uploadFiles(Array.from(e.target.files))
            e.target.value = ''   // allow re-selecting the same file
          }
        }}
      />

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {value.length >= maxFiles && (
        <p className="text-xs text-stone-400 text-center">
          Досягнуто максимум {maxFiles} фото
        </p>
      )}
    </div>
  )
}
