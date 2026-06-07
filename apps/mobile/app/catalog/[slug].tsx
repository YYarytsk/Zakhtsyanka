import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useCart } from '@/lib/cart'
import { colors, spacing, radius, typography } from '@/lib/theme'
import { getLocalizedName, getLocalizedDescription, formatPrice } from '@zakhtsyanka/shared/utils'
import type { Product } from '@zakhtsyanka/shared/types'
import i18n from '@/lib/i18n'

type Locale = 'uk' | 'en'

export default function ProductDetailScreen() {
  const { slug }     = useLocalSearchParams<{ slug: string }>()
  const { t }        = useTranslation()
  const navigation   = useNavigation()
  const lang         = (i18n.language ?? 'uk') as Locale
  const addItem      = useCart((s) => s.addItem)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [added,   setAdded]   = useState(false)

  useEffect(() => {
    api.get<Product>(`/api/products/${slug}`)
      .then((p) => {
        setProduct(p)
        navigation.setOptions({ title: lang === 'uk' ? p.nameUk : p.nameEn })
      })
      .finally(() => setLoading(false))
  }, [slug, lang])

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.amber[600]} /></View>
  if (!product) return <View style={s.center}><Text style={s.error}>Товар не знайдено</Text></View>

  const { value: name }        = getLocalizedName(product, lang)
  const { value: description } = getLocalizedDescription(product, lang)
  const allergens = lang === 'uk' ? product.allergensUk : product.allergensEn

  function handleAddToCart() {
    addItem({
      productId:        product!.id,
      slug:             product!.slug,
      nameUk:           product!.nameUk,
      nameEn:           product!.nameEn,
      priceCents:       product!.priceCents,
      photo:            product!.photos[0] ?? null,
      fulfillmentTypes: product!.fulfillmentTypes,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Photo */}
        <View style={s.imgWrap}>
          {product.photos[0] ? (
            <Image source={{ uri: product.photos[0] }} style={s.img} resizeMode="cover" />
          ) : (
            <Text style={s.emoji}>🥐</Text>
          )}
        </View>

        <View style={s.body}>
          <View style={s.header}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.price}>{formatPrice(product.priceCents, lang)}</Text>
          </View>

          {description ? <Text style={s.description}>{description}</Text> : null}

          {/* Allergens */}
          {allergens && (
            <View style={s.allergenBox}>
              <Text style={s.allergenTitle}>
                {lang === 'uk' ? 'Алергени та склад' : 'Allergens & ingredients'}
              </Text>
              <Text style={s.allergenText}>{allergens}</Text>
              <Text style={s.allergenNote}>{t('catalog.allergenNote')}</Text>
            </View>
          )}

          {/* Fulfillment badges */}
          <View style={s.badges}>
            {product.fulfillmentTypes.map((type) => (
              <View key={type} style={s.badge}>
                <Text style={s.badgeText}>
                  {t(`catalog.fulfillment.${type}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add to cart */}
      <View style={s.footer}>
        <Pressable
          style={[s.addBtn, !product.isAvailable && s.addBtnDisabled]}
          onPress={handleAddToCart}
          disabled={!product.isAvailable}
        >
          <Text style={s.addBtnText}>
            {!product.isAvailable
              ? t('catalog.outOfStock')
              : added
              ? '✓'
              : t('catalog.addToCart')}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error:         { color: colors.stone[500] },
  scroll:        { paddingBottom: 100 },
  imgWrap:       { aspectRatio: 1, backgroundColor: colors.stone[100], alignItems: 'center', justifyContent: 'center' },
  img:           { width: '100%', height: '100%' },
  emoji:         { fontSize: 64 },
  body:          { padding: spacing.lg, gap: spacing.md },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  name:          { flex: 1, fontSize: 20, fontWeight: '700', color: colors.stone[900] },
  price:         { fontSize: 20, fontWeight: '700', color: colors.amber[700] },
  description:   { fontSize: 15, lineHeight: 22, color: colors.stone[600] },
  allergenBox:   { backgroundColor: colors.amber[50], borderWidth: 1, borderColor: colors.amber[200], borderRadius: radius.md, padding: spacing.md, gap: 4 },
  allergenTitle: { fontWeight: '600', color: colors.amber[900], fontSize: 14 },
  allergenText:  { fontSize: 13, color: colors.amber[800] },
  allergenNote:  { fontSize: 11, color: colors.amber[600] },
  badges:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge:         { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, backgroundColor: colors.stone[100], borderWidth: 1, borderColor: colors.stone[200] },
  badgeText:     { fontSize: 12, color: colors.stone[600], fontWeight: '500' },
  footer:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.stone[200] },
  addBtn:        { backgroundColor: colors.amber[600], borderRadius: radius.full, paddingVertical: 14, alignItems: 'center' },
  addBtnDisabled:{ backgroundColor: colors.stone[300] },
  addBtnText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
})
