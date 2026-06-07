import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { I18nextProvider } from 'react-i18next'
import i18n, { initI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { registerForPushNotifications } from '@/lib/notifications'
import { api } from '@/lib/api'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function bootstrap() {
      await initI18n()

      // Keep push token in sync on the server when user is signed in
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const token = await registerForPushNotifications()
        if (token) {
          api.post('/api/account/push-token', { token }).catch(() => {})
        }
      }

      setReady(true)
      await SplashScreen.hideAsync()
    }
    bootstrap()
  }, [])

  if (!ready) return null

  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="catalog/[slug]" options={{ headerShown: true, headerBackTitle: '' }} />
        <Stack.Screen name="orders/[id]"    options={{ headerShown: true, headerBackTitle: '' }} />
        <Stack.Screen name="auth/login"     options={{ presentation: 'modal', headerShown: true, title: '' }} />
        <Stack.Screen name="auth/signup"    options={{ presentation: 'modal', headerShown: true, title: '' }} />
        <Stack.Screen name="custom-order"   options={{ headerShown: true, headerBackTitle: '' }} />
      </Stack>
    </I18nextProvider>
  )
}
