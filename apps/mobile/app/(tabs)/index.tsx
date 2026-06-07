import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, Pressable,
  StyleSheet, Image, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { colors, spacing, radius, typography } from '@/lib/theme'
import type { Product, Category } from '@zakhtsyanka/shared/types'
import { getLocalizedName, formatPrice } from '@zakhtsyanka/shared/utils'
import i18n from '@/lib/i18n'

type Locale = 'uk' | 'en'

export default function CatalogScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const lang   = (i18n.language ?? 'uk') as Locale

  const [products,   setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [query,      setQuery]      = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (activeCategory) params.set('category', activeCategory)
      if (query.trim())   params.set('q', query.trim())
      const [prods, cats] = await Promise.all([
        api.get<Product[]>(`/api/products?${params}`),
        api.get<Category[]>('/api/categories'),
      ])
      setProducts(prods)
      setCategories(cats)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeCategory, query])

  useEffect(() => { fetchData() }, [fetchData])

  function onRefresh() { setRefreshing(true); fetchData() }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.amber[600]} /></View>
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('catalog.searchPlaceholder')}
          placeholderTextColor={colors.stone[400]}
          style={styles.search}
          returnKeyType="search"
          onSubmitEditing={fetchData}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
        <Pressable
          onPress={() => setActiveCategory(null)}
          style={[styles.catChip, !activeCategory && styles.catChipActive]}
        >
          <Text style={[styles.catText, !activeCategory && styles.catTextActive]}>
            {t('catalog.filters.all')}
          </Text>
        </Pressable>
        {categories.map((c) => {
          const isActive = c.slug === activeCategory
          return (
            <Pressable key={c.id} onPress={() => setActiveCategory(isActive ? null : c.slug)}
              style={[styles.catChip, isActive && styles.catChipActive]}>
              <Text style={[styles.catText, isActive && styles.catTextActive]}>
                {lang === 'uk' ? c.nameUk : c.nameEn}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Product grid */}
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber[600]} />}
        ListEmptyComponent={<Text style={styles.empty}>{t('catalog.noResults')}</Text>}
        renderItem={({ item: p }) => {
          const { value: name } = getLocalizedName(p, lang)
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/catalog/${p.slug}`)}>
              <View style={styles.imgWrap}>
                {p.photos[0] ? (
                  <Image source={{ uri: p.photos[0] }} style={styles.img} resizeMode="cover" />
                ) : (
                  <Text style={styles.emoji}>🥐</Text>
                )}
                {!p.isAvailable && (
                  <View style={styles.soldOut}>
                    <Text style={styles.soldOutText}>{t('catalog.outOfStock')}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={2}>{name}</Text>
                <Text style={styles.cardPrice}>{formatPrice(p.priceCents, lang)}</Text>
              </View>
            </Pressable>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap:    { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  search:        { backgroundColor: '#fff', borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: colors.stone[200], color: colors.stone[900] },
  catScroll:     { flexGrow: 0 },
  catContent:    { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: 8, flexDirection: 'row' },
  catChip:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.stone[100] },
  catChipActive: { backgroundColor: colors.amber[600] },
  catText:       { fontSize: 13, fontWeight: '500', color: colors.stone[700] },
  catTextActive: { color: '#fff' },
  list:          { padding: spacing.md, gap: spacing.sm },
  row:           { gap: spacing.sm, marginBottom: spacing.sm },
  card:          { flex: 1, backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.stone[100] },
  imgWrap:       { aspectRatio: 4 / 3, backgroundColor: colors.stone[100], alignItems: 'center', justifyContent: 'center' },
  img:           { width: '100%', height: '100%' },
  emoji:         { fontSize: 36 },
  soldOut:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
  soldOutText:   { fontSize: 12, color: colors.stone[500], fontWeight: '500' },
  cardBody:      { padding: spacing.sm },
  cardName:      { fontSize: 13, fontWeight: '600', color: colors.stone[900], marginBottom: 2 },
  cardPrice:     { fontSize: 13, fontWeight: '700', color: colors.amber[700] },
  empty:         { textAlign: 'center', color: colors.stone[400], marginTop: 40, fontSize: 14 },
})
