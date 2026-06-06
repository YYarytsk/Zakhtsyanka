import { getCategories } from '@/lib/db/categories'
import { ProductForm } from '@/components/admin/ProductForm'

export default async function NewProductPage() {
  const categories = await getCategories()
  const cats = categories.map((c) => ({ id: c.id, nameUk: c.nameUk, nameEn: c.nameEn }))

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900 mb-6">Новий товар</h1>
      <ProductForm categories={cats} />
    </div>
  )
}
