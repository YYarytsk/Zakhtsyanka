import { getDictionary, hasLocale } from '../../../dictionaries'
import { ConfirmationPoller } from '@/components/checkout/ConfirmationPoller'

// WayForPay redirects here immediately after payment.
// The IPN webhook may arrive at the same time or slightly later.
// ConfirmationPoller polls /api/orders/[id]/status and shows the result.
export default async function ConfirmationPage(
  props: PageProps<'/[lang]/orders/[id]/confirmation'>,
) {
  const { lang: rawLang, id } = await props.params
  if (!hasLocale(rawLang)) {
    const { notFound } = await import('next/navigation')
    notFound()
  }
  const lang = rawLang as 'uk' | 'en'

  const dict = await getDictionary(lang)
  const d    = dict as Record<string, Record<string, string>>

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <ConfirmationPoller orderId={id} lang={lang as 'uk' | 'en'} dict={d} />
    </div>
  )
}
