// First-run admin setup page.
// Shows the setup wizard only if no staff account exists yet.
// After setup, this page redirects to /admin/orders.

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { SetupForm } from '@/components/admin/SetupForm'

export default async function AdminSetupPage() {
  const admin = createAdminClient()
  const { count } = await admin.from('staff').select('id', { count: 'exact', head: true })

  // Already set up — send them to sign in
  if ((count ?? 0) > 0) {
    redirect('/admin/orders')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 440, width: '100%', padding: '0 16px' }}>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e7e5e4', padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <p style={{ fontSize: 40, margin: '0 0 8px' }}>🥐</p>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1c1917', margin: '0 0 6px' }}>
                Перше налаштування адміну
              </h1>
              <p style={{ fontSize: 14, color: '#78716c', margin: 0 }}>
                First-time admin setup
              </p>
            </div>

            <div style={{ background: '#fef3c7', borderRadius: 12, padding: '14px 16px', marginBottom: 24, fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
              <strong>Крок 1:</strong> Зареєструйтесь або увійдіть у свій акаунт через <a href="/uk/auth/signup" style={{ color: '#92400e' }}>сторінку реєстрації</a>.<br /><br />
              <strong>Step 1:</strong> Register or sign in via the <a href="/uk/auth/signup" style={{ color: '#92400e' }}>signup page</a>.<br /><br />
              <strong>Крок 2 / Step 2:</strong> Поверніться сюди та натисніть &ldquo;Зробити мене адміном&rdquo; нижче.<br /><br />
              This page is only available before the first admin account is created. After setup it becomes inaccessible.
            </div>

            <SetupForm />
          </div>
        </div>
      </div>
  )
}
