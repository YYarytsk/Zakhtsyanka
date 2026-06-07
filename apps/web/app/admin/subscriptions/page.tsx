import { getAllSubscriptionsAdmin, getProductionList } from '@/lib/db/subscriptions'
import { getAllProductsAdmin } from '@/lib/db/products'
import { formatDate } from '@zakhtsyanka/shared/utils'

export default async function AdminSubscriptionsPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [subs, productionList, allProducts] = await Promise.all([
    getAllSubscriptionsAdmin(),
    getProductionList(today),
    getAllProductsAdmin(),
  ])

  const productMap = new Map(allProducts.map((p) => [p.id, p]))

  const FREQ_UK: Record<string, string> = { weekly: 'Щотижня', biweekly: 'Раз на 2 тижні', monthly: 'Щомісяця' }
  const TYPE_UK: Record<string, string> = { pickup: 'Самовивіз', delivery: 'Доставка', preorder: 'Передзамовлення' }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold text-stone-900">Підписки</h1>

      {/* Production list for today */}
      <section>
        <h2 className="font-semibold text-stone-700 mb-3">
          Список виробництва на сьогодні ({formatDate(today, 'uk')})
        </h2>
        {productionList.length === 0 ? (
          <p className="text-stone-400 text-sm">Сьогодні підписок немає</p>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200 bg-amber-100">
                  <th className="text-left px-4 py-2.5 font-semibold text-amber-900">Товар</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-amber-900">Тип</th>
                  <th className="text-right px-4 py-2.5 font-bold text-amber-900">Кількість</th>
                </tr>
              </thead>
              <tbody>
                {productionList.map((item) => (
                  <tr key={`${item.productId}-${item.fulfillmentType}`} className="border-b border-amber-100 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-stone-900">{item.nameUk}</td>
                    <td className="px-4 py-2.5 text-stone-600">{TYPE_UK[item.fulfillmentType] ?? item.fulfillmentType}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-2xl text-amber-700">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* All active subscriptions */}
      <section>
        <h2 className="font-semibold text-stone-700 mb-3">Активні підписки ({subs.length})</h2>
        {subs.length === 0 ? (
          <p className="text-stone-400 text-sm">Немає активних підписок</p>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Товар</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Частота</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Наступна дата</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Тип</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {subs.map((sub) => {
                  const p = productMap.get(sub.productId)
                  return (
                    <tr key={sub.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3 font-medium text-stone-900">{p?.nameUk ?? sub.productId.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-stone-600">{FREQ_UK[sub.frequency] ?? sub.frequency}</td>
                      <td className="px-4 py-3 text-stone-700">{formatDate(sub.nextFulfillmentDate, 'uk')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                          {sub.status === 'active' ? 'Активна' : 'Пауза'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500">{TYPE_UK[sub.fulfillmentType] ?? sub.fulfillmentType}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
