import { formatMessage } from '@zakhtsyanka/shared/utils/i18n'
import { formatDate } from '@zakhtsyanka/shared/utils'
import type { LoyaltyTransaction } from '@zakhtsyanka/shared/types'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface LoyaltyCardProps {
  balance: number
  history: LoyaltyTransaction[]
  lang: SupportedLocale
  dict: Record<string, Record<string, string>>
}

const REASON_UK: Record<string, string> = {
  order_earned:      'За замовлення',
  reward_redeemed:   'Використання нагороди',
  referral_bonus:    'Реферальний бонус',
  birthday_bonus:    'День народження',
  manual_adjustment: 'Ручне коригування',
}
const REASON_EN: Record<string, string> = {
  order_earned:      'Order reward',
  reward_redeemed:   'Reward redeemed',
  referral_bonus:    'Referral bonus',
  birthday_bonus:    'Birthday bonus',
  manual_adjustment: 'Manual adjustment',
}

export function LoyaltyCard({ balance, history, lang, dict }: LoyaltyCardProps) {
  const loyaltyDict = (dict['account'] as unknown as Record<string, Record<string, string>>)?.['loyalty'] ?? {}
  const isUk = lang === 'uk'

  const balanceStr = formatMessage(
    loyaltyDict['balance'] ?? '{count}',
    { count: balance },
    lang,
  )

  return (
    <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white flex flex-col gap-4">
      {/* Balance */}
      <div>
        <p className="text-amber-100 text-sm font-medium">{loyaltyDict['title']}</p>
        <p className="text-3xl font-bold mt-1">{balanceStr}</p>
      </div>

      {/* Recent transactions */}
      {history.length > 0 && (
        <div className="bg-white/15 rounded-xl p-3 flex flex-col gap-2">
          {history.slice(0, 5).map((tx) => {
            const label = (isUk ? REASON_UK : REASON_EN)[tx.reason] ?? tx.reason
            const sign  = tx.points > 0 ? '+' : ''
            return (
              <div key={tx.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-amber-200 text-xs">{formatDate(tx.createdAt, lang)}</p>
                </div>
                <span className={tx.points > 0 ? 'text-green-300 font-bold' : 'text-red-300 font-bold'}>
                  {sign}{tx.points}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
