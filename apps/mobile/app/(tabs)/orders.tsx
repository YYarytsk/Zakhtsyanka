import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { colors, spacing, radius } from '@/lib/theme'
import { formatDateTime, formatPrice } from '@zakhtsyanka/shared/utils'
import type { Order } from '@zakhtsyanka/shared/types'
import i18n from '@/lib/i18n'

type Locale = 'uk' | 'en'

const STATUS_COLOR: Record<string, string> = {
  received: '#dbeafe', preparing: '#fef3c7', ready: '#dcfce7',
  out_for_delivery: '#ede9fe', completed: '#f5f5f4', cancelled: '#fee2e2',
}
const STATUS_TEXT: Record<string, { uk: string; en: string }> = {
  received:         { uk: 'Отримано',  en: 'Received' },
  preparing:        { uk: 'Готується', en: 'Preparing' },
  ready:            { uk: 'Готово',    en: 'Ready' },
  out_for_delivery: { uk: 'В дорозі',  en: 'On the way' },
  completed:        { uk: 'Виконано',  en: 'Completed' },
  cancelled:        { uk: 'Скасовано', en: 'Cancelled' },
}

export default function OrdersScreen() {
  const { t }  = useTranslation()
  const router = useRouter()
  const lang   = (i18n.language ?? 'uk') as Locale
  const [orders,    setOrders]    = useState<Order[]>([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [authed,    setAuthed]    = useState(false)

  const fetchOrders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAuthed(false); setLoading(false); return }
    setAuthed(true)
    try {
      const data = await api.get<Order[]>('/api/orders')
      setOrders(data.filter((o) => o.status !== 'pending_payment'))
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.amber[600]} /></View>

  if (!authed) {
    return (
      <View style={s.center}>
        <Text style={s.emptyText}>{lang === 'uk' ? 'Увійдіть, щоб бачити замовлення' : 'Sign in to view your orders'}</Text>
        <Pressable style={s.loginBtn} onPress={() => router.push('/auth/login')}>
          <Text style={s.loginBtnText}>{t('nav.login')}</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders() }} tintColor={colors.amber[600]} />}
      ListEmptyComponent={<Text style={s.emptyText}>{t('orders.empty')}</Text>}
      renderItem={({ item: o }) => {
        const status = STATUS_TEXT[o.status]
        return (
          <Pressable style={s.card} onPress={() => router.push(`/orders/${o.id}`)}>
            <View style={s.cardTop}>
              <Text style={s.orderId}>#{o.id.slice(0, 8).toUpperCase()}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_COLOR[o.status] ?? '#f5f5f4' }]}>
                <Text style={s.badgeText}>{lang === 'uk' ? status?.uk : status?.en}</Text>
              </View>
            </View>
            <Text style={s.slot}>{formatDateTime(o.fulfillmentSlot, lang)}</Text>
            <Text style={s.items} numberOfLines={1}>
              {o.lineItems.map((i) => `${lang === 'uk' ? i.nameUk : i.nameEn} ×${i.quantity}`).join(', ')}
            </Text>
            <Text style={s.total}>{formatPrice(o.totalCents, lang)}</Text>
          </Pressable>
        )
      }}
    />
  )
}

const s = StyleSheet.create({
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  list:        { padding: spacing.md, gap: spacing.sm },
  emptyText:   { fontSize: 14, color: colors.stone[500], textAlign: 'center' },
  loginBtn:    { backgroundColor: colors.amber[600], paddingHorizontal: 24, paddingVertical: 10, borderRadius: radius.full },
  loginBtnText:{ color: '#fff', fontWeight: '600' },
  card:        { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, gap: 4, borderWidth: 1, borderColor: colors.stone[100] },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId:     { fontWeight: '700', color: colors.stone[900] },
  badge:       { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  badgeText:   { fontSize: 11, fontWeight: '600', color: colors.stone[700] },
  slot:        { fontSize: 13, color: colors.stone[500] },
  items:       { fontSize: 13, color: colors.stone[600] },
  total:       { fontSize: 15, fontWeight: '700', color: colors.amber[700], marginTop: 2 },
})
