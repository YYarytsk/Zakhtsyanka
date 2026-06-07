import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@zakhtsyanka/shared/utils'
import { colors, spacing, radius } from '@/lib/theme'
import i18n from '@/lib/i18n'

type Locale = 'uk' | 'en'

export default function CartScreen() {
  const { t }  = useTranslation()
  const router = useRouter()
  const lang   = (i18n.language ?? 'uk') as Locale
  const { items, orderType, setOrderType, updateQuantity, removeItem, subtotalCents, totalCents, deliveryFeeCents } = useCart()

  if (items.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.emptyEmoji}>🛒</Text>
        <Text style={s.emptyText}>{t('cart.empty')}</Text>
        <Pressable style={s.browseBtn} onPress={() => router.push('/')}>
          <Text style={s.browseBtnText}>{t('cart.emptyAction')}</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={s.list}
        ListHeaderComponent={(
          <>
            {/* Order type */}
            <View style={s.typeSel}>
              {(['pickup', 'delivery'] as const).map((type) => (
                <Pressable key={type} onPress={() => setOrderType(type)}
                  style={[s.typeBtn, orderType === type && s.typeBtnActive]}>
                  <Text style={[s.typeBtnText, orderType === type && s.typeBtnTextActive]}>
                    {t(`cart.orderType.${type}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        renderItem={({ item }) => {
          const name = lang === 'uk' ? item.nameUk : item.nameEn
          return (
            <View style={s.item}>
              <View style={s.itemInfo}>
                <Text style={s.itemName}>{name}</Text>
                <Text style={s.itemPrice}>{formatPrice(item.priceCents, lang)}</Text>
              </View>
              <View style={s.stepper}>
                <Pressable style={s.stepBtn} onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                  <Text style={s.stepBtnText}>−</Text>
                </Pressable>
                <Text style={s.qty}>{item.quantity}</Text>
                <Pressable style={s.stepBtn} onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
                  <Text style={s.stepBtnText}>+</Text>
                </Pressable>
              </View>
              <Text style={s.lineTotal}>{formatPrice(item.priceCents * item.quantity, lang)}</Text>
              <Pressable onPress={() => removeItem(item.productId)} hitSlop={8}>
                <Text style={s.remove}>✕</Text>
              </Pressable>
            </View>
          )
        }}
        ListFooterComponent={(
          <View style={s.summary}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>{t('cart.subtotal')}</Text>
              <Text style={s.summaryVal}>{formatPrice(subtotalCents(), lang)}</Text>
            </View>
            {orderType === 'delivery' && deliveryFeeCents > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>{t('cart.deliveryFee')}</Text>
                <Text style={s.summaryVal}>{formatPrice(deliveryFeeCents, lang)}</Text>
              </View>
            )}
            <View style={[s.summaryRow, s.totalRow]}>
              <Text style={s.totalLabel}>{t('cart.total')}</Text>
              <Text style={s.totalVal}>{formatPrice(totalCents(), lang)}</Text>
            </View>
            <Pressable style={s.checkoutBtn} onPress={() => router.push('/checkout' as any)}>
              <Text style={s.checkoutBtnText}>{t('cart.proceedToCheckout')}</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji:       { fontSize: 48 },
  emptyText:        { fontSize: 15, color: colors.stone[500] },
  browseBtn:        { backgroundColor: colors.amber[600], paddingHorizontal: 24, paddingVertical: 10, borderRadius: radius.full, marginTop: 4 },
  browseBtnText:    { color: '#fff', fontWeight: '600' },
  list:             { padding: spacing.md, gap: spacing.sm },
  typeSel:          { flexDirection: 'row', borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.stone[200], marginBottom: spacing.sm },
  typeBtn:          { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  typeBtnActive:    { backgroundColor: colors.amber[600] },
  typeBtnText:      { fontSize: 14, fontWeight: '500', color: colors.stone[700] },
  typeBtnTextActive:{ color: '#fff' },
  item:             { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.stone[100] },
  itemInfo:         { flex: 1 },
  itemName:         { fontSize: 13, fontWeight: '600', color: colors.stone[900] },
  itemPrice:        { fontSize: 12, color: colors.stone[500] },
  stepper:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn:          { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.stone[300], alignItems: 'center', justifyContent: 'center' },
  stepBtnText:      { fontSize: 16, color: colors.stone[700] },
  qty:              { fontSize: 14, fontWeight: '600', color: colors.stone[900], minWidth: 20, textAlign: 'center' },
  lineTotal:        { fontSize: 14, fontWeight: '700', color: colors.stone[900], minWidth: 60, textAlign: 'right' },
  remove:           { fontSize: 14, color: colors.stone[300], paddingHorizontal: 4 },
  summary:          { marginTop: spacing.md, backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.stone[100] },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel:     { fontSize: 14, color: colors.stone[600] },
  summaryVal:       { fontSize: 14, color: colors.stone[700] },
  totalRow:         { borderTopWidth: 1, borderTopColor: colors.stone[100], paddingTop: spacing.sm },
  totalLabel:       { fontSize: 16, fontWeight: '700', color: colors.stone[900] },
  totalVal:         { fontSize: 16, fontWeight: '700', color: colors.amber[700] },
  checkoutBtn:      { backgroundColor: colors.amber[600], borderRadius: radius.full, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  checkoutBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
})
