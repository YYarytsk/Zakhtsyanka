// First-run admin setup page.
// Does NOT require SUPABASE_SERVICE_ROLE_KEY — uses the anon key + a
// security-definer Postgres function to safely create the first staff row.

import { SetupForm } from '@/components/admin/SetupForm'

export default function AdminSetupPage() {
  // Don't pre-check staff count here — the API and the SetupForm handle it.
  // This avoids needing the service role key just to render the page.
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

          <div style={{ background: '#fef3c7', borderRadius: 12, padding: '14px 16px', marginBottom: 24, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
            <strong>Крок 1 / Step 1:</strong><br />
            Зареєструйтесь або увійдіть →{' '}
            <a href="/uk/auth/signup" style={{ color: '#92400e', fontWeight: 600 }}>/uk/auth/signup</a>
            <br /><br />
            <strong>Крок 2 / Step 2:</strong><br />
            Поверніться сюди і натисніть кнопку нижче.<br />
            Return here and click the button below.
          </div>

          <SetupForm />
        </div>
      </div>
    </div>
  )
}
