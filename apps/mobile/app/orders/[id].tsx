import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { colors, spacing, radius } from '@/lib/theme'
import { formatDateTime, formatPrice } from '@zakhtsyanka/shared/utils'
import type { Order, OrderStatus } from '@zakhtsyanka/shared/types'
import i18n from '@/lib/i18n'

type Locale = 'uk' | 'en'

const STEPS: OrderStatus[] = ['received', 'preparing', 'ready', 'out_for_delivery', 'completed']
const STATUS_LABELS: Record<string, { uk: string; en: string }> = {
  received:         { uk: 'Отримано',   en: 'Received' },
  preparing:        { uk: 'Готується',  en: 'Preparing' },
  ready:            { uk: 'Готово',     en: 'Ready' },
  out_for_delivery: { uk: 'В дорозі',   en: 'On the way' },
  completed:        { uk: 'Виконано',   en: 'Completed' },
  cancelled:        { uk: 'Скасовано',  en: 'Cancelled' },
}

export default function OrderDetailScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>()
  const { t }      = useTranslation()
  const navigation = useNavigation()
  const lang       = (i18n.language ?? 'uk') as Locale

  const [order,   setOrder]   = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Order>(`/api/orders/${id}`)
      .then((o) => {
        setOrder(o)
        navigation.setOptions({ title: `#${o.id.slice(0, 8).toUpperCase()}` })
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.amber[600]} /></View>
  if (!order)  return <View style={s.center}><Text style={s.error}>Замовлення не знайдено</Text></View>

  const currentStep = STEPS.indexOf(order.status as OrderStatus)
  const steps = order.type === 'pickup' ? STEPS.filter((s) => s !== 'out_for_delivery') : STEPS

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Fulfillment info */}
      <View style={s.card}>
        <Text style={s.slotLabel}>{t('orders.fulfillmentSlot').replace('{slot}', formatDateTime(order.fulfillmentSlot, lang))}</Text>
        <Text style={s.typeLabel}>{order.type === 'pickup' ? t('orders.type.pickup') : t('orders.type.delivery')}</Text>
      </View>

      {/* Status timeline */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>{t('orders.timeline')}</Text>
        {steps.map((step, i) => {
          const idx    = STEPS.indexOf(step)
          const done   = idx <= currentStep
          const active = step === order.status
          const label  = STATUS_LABELS[step]
          return (
            <View key={step} style={s.stepRow}>
              <View style={[s.stepDot, done && s.stepDotDone, active && s.stepDotActive]}>
                <Text style={[s.stepDotText, done && s.stepDotTextDone]}>
                  {done && !active ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[s.stepLabel, active && s.stepLabelActive]}>
                {lang === 'uk' ? label?.uk : label?.en}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Line items */}
      <View style={s.card}>
        {order.lineItems.map((item) => (
          <View key={item.productId} style={s.itemRow}>
            <Text style={s.itemName}>{lang === 'uk' ? item.nameUk : item.nameEn} × {item.quantity}</Text>
            <Text style={s.itemPrice}>{formatPrice(item.priceCents * item.quantity, lang)}</Text>
          </View>
        ))}
        {order.deliveryFeeCents > 0 && (
          <View style={s.itemRow}>
            <Text style={s.itemName}>{lang === 'uk' ? 'Доставка' : 'Delivery'}</Text>
            <Text style={s.itemPrice}>{formatPrice(order.deliveryFeeCents, lang)}</Text>
          </View>
        )}
        <View style={[s.itemRow, s.totalRow]}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalVal}>{formatPrice(order.totalCents, lang)}</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  content:          { padding: spacing.md, gap: spacing.sm },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error:            { color: colors.stone[500] },
  card:             { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.stone[100] },
  slotLabel:        { fontSize: 15, fontWeight: '600', color: colors.stone[900] },
  typeLabel:        { fontSize: 13, color: colors.stone[500] },
  sectionTitle:     { fontSize: 14, fontWeight: '600', color: colors.stone[700], marginBottom: 4 },
  stepRow:          { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot:          { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.stone[100], alignItems: 'center', justifyContent: 'center' },
  stepDotDone:      { backgroundColor: colors.green[500] },
  stepDotActive:    { backgroundColor: colors.amber[600] },
  stepDotText:      { fontSize: 11, fontWeight: '700', color: colors.stone[400] },
  stepDotTextDone:  { color: '#fff' },
  stepLabel:        { fontSize: 14, color: colors.stone[500] },
  stepLabelActive:  { fontWeight: '700', color: colors.stone[900] },
  itemRow:          { flexDirection: 'row', justifyContent: 'space-between' },
  itemName:         { fontSize: 14, color: colors.stone[700] },
  itemPrice:        { fontSize: 14, fontWeight: '500', color: colors.stone[900] },
  totalRow:         { borderTopWidth: 1, borderTopColor: colors.stone[100], paddingTop: spacing.sm },
  totalLabel:       { fontSize: 16, fontWeight: '700', color: colors.stone[900] },
  totalVal:         { fontSize: 16, fontWeight: '700', color: colors.amber[700] },
})
