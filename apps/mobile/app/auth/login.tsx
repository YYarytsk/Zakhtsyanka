import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { colors, spacing, radius } from '@/lib/theme'
import i18n from '@/lib/i18n'

export default function LoginScreen() {
  const router = useRouter()
  const lang   = i18n.language ?? 'uk'
  const isUk   = lang === 'uk'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      Alert.alert(isUk ? 'Помилка' : 'Error', isUk ? 'Невірний email або пароль' : 'Invalid email or password')
      return
    }
    router.replace('/(tabs)/account')
  }

  const inputBase = [s.input]

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.content}>
        <Text style={s.title}>{isUk ? 'Вхід в акаунт' : 'Sign in'}</Text>
        <Text style={s.subtitle}>{isUk ? 'Ласкаво просимо назад!' : 'Welcome back!'}</Text>

        <View style={s.form}>
          <View>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={inputBase}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.stone[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          <View>
            <Text style={s.label}>{isUk ? 'Пароль' : 'Password'}</Text>
            <TextInput
              style={inputBase}
              value={password}
              onChangeText={setPassword}
              placeholder={isUk ? 'Мінімум 8 символів' : 'At least 8 characters'}
              placeholderTextColor={colors.stone[400]}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <Pressable style={s.submitBtn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitBtnText}>{isUk ? 'Увійти' : 'Sign in'}</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/auth/signup')}>
          <Text style={s.switchText}>
            {isUk ? 'Немає акаунту? ' : "Don't have an account? "}
            <Text style={s.switchLink}>{isUk ? 'Зареєструватись' : 'Sign up'}</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  content:      { flex: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.lg },
  title:        { fontSize: 26, fontWeight: '700', color: colors.stone[900] },
  subtitle:     { fontSize: 15, color: colors.stone[500], marginTop: -spacing.sm },
  form:         { gap: spacing.md },
  label:        { fontSize: 13, fontWeight: '500', color: colors.stone[600], marginBottom: 6 },
  input:        { backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.stone[300], paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.stone[900] },
  submitBtn:    { backgroundColor: colors.amber[600], borderRadius: radius.full, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitBtnText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText:   { textAlign: 'center', fontSize: 14, color: colors.stone[500] },
  switchLink:   { color: colors.amber[700], fontWeight: '600' },
})
