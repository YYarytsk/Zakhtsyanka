import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { View, Text, StyleSheet } from 'react-native'
import { useCart } from '@/lib/cart'
import { colors } from '@/lib/theme'

function CartTabIcon({ color }: { color: string }) {
  const count = useCart((s) => s.itemCount())
  return (
    <View>
      <Ionicons name="bag-outline" size={24} color={color} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: colors.amber[600], borderRadius: 99,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
})

export default function TabsLayout() {
  const { t } = useTranslation()

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor:   colors.amber[600],
      tabBarInactiveTintColor: colors.stone[400],
      tabBarStyle:             { borderTopColor: colors.stone[200] },
      headerShown:             true,
      headerStyle:             { backgroundColor: '#fff' },
      headerTitleStyle:        { color: colors.stone[900], fontWeight: '700' },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title:        t('nav.catalog'),
          tabBarLabel:  t('nav.catalog'),
          tabBarIcon:   ({ color }) => <Ionicons name="storefront-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title:       t('nav.cart'),
          tabBarLabel: t('nav.cart'),
          tabBarIcon:  ({ color }) => <CartTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title:       t('nav.orders'),
          tabBarLabel: t('nav.orders'),
          tabBarIcon:  ({ color }) => <Ionicons name="receipt-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title:       t('nav.account'),
          tabBarLabel: t('nav.account'),
          tabBarIcon:  ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  )
}
