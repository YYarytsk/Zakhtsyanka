import { createAdminClient } from '@/lib/supabase/server'
import { AdminGalleryManager } from '@/components/admin/AdminGalleryManager'

interface GalleryRow {
  id: string
  caption_uk: string
  caption_en: string
  photos: string[]
  tags: string[]
  is_published: boolean
  sort_order: number
}

export default async function AdminGalleryPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('gallery')
    .select('*')
    .order('sort_order')
    .returns<GalleryRow[]>()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Галерея тортів</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Публічна галерея на <a href="/uk/gallery" target="_blank" className="text-amber-700 hover:underline">/gallery</a>
          </p>
        </div>
      </div>
      <AdminGalleryManager initialItems={data ?? []} />
    </div>
  )
}
