import { notFound } from 'next/navigation'
import { getAllProductsAdmin } from '@/lib/db/products'
import { getCategories } from '@/lib/db/categories'
import { ProductForm } from '@/components/admin/ProductForm'

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const [products, categories] = await Promise.all([getAllProductsAdmin(), getCategories()])
  const product = products.find((p) => p.id === id)
  if (!product) notFound()
  const cats = categories.map((c) => ({ id: c.id, nameUk: c.nameUk, nameEn: c.nameEn }))

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900 mb-6">Редагувати: {product.nameUk}</h1>
      <ProductForm product={product} categories={cats} />
    </div>
  )
}
