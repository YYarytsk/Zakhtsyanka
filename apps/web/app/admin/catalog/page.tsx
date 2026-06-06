import Link from 'next/link'
import { getAllProductsAdmin } from '@/lib/db/products'
import { formatPrice } from '@zakhtsyanka/shared/utils'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'

export default async function AdminCatalogPage() {
  const products = await getAllProductsAdmin()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-stone-900">Каталог</h1>
        <Link
          href={'/admin/catalog/new' as any}
          className="inline-flex items-center gap-1 bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-amber-700 transition-colors"
        >
          + Додати товар
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-4 py-3 font-medium text-stone-600">Назва (UK)</th>
              <th className="text-left px-4 py-3 font-medium text-stone-600">Name (EN)</th>
              <th className="text-left px-4 py-3 font-medium text-stone-600">Ціна</th>
              <th className="text-left px-4 py-3 font-medium text-stone-600">Доступний</th>
              <th className="text-left px-4 py-3 font-medium text-stone-600">Переклад EN</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.map((p) => {
              const missingEn = !p.nameEn || !p.descriptionEn
              return (
                <tr key={p.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-stone-900">{p.nameUk}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {p.nameEn || (
                      <span className="text-amber-600 italic text-xs">відсутній</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{formatPrice(p.priceCents, 'uk')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block w-2 h-2 rounded-full ${p.isAvailable ? 'bg-green-500' : 'bg-stone-300'}`} />
                  </td>
                  <td className="px-4 py-3">
                    {missingEn ? (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Потрібен переклад
                      </span>
                    ) : (
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/catalog/${p.id}` as any}
                        className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
                      >
                        Редагувати
                      </Link>
                      <DeleteProductButton productId={p.id} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <p className="text-center text-stone-400 py-12 text-sm">
            Каталог порожній. Додайте перший товар.
          </p>
        )}
      </div>
    </div>
  )
}
