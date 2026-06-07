// First-run admin setup — lives OUTSIDE app/admin/ so the admin auth layout
// does not apply. Anyone can reach this page; the API enforces single-use safety.
import { SetupForm } from '@/components/admin/SetupForm'

export default function SetupPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#fafaf9',
    }}>
      <div style={{ maxWidth: 440, width: '100%', padding: '0 16px' }}>
        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid #e7e5e4', padding: 32,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <p style={{ fontSize: 48, margin: '0 0 8px' }}>🥐</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1c1917', margin: '0 0 4px' }}>
              Захцянка · Admin setup
            </h1>
            <p style={{ fontSize: 14, color: '#78716c', margin: 0 }}>
              One-time setup to create the first admin account
            </p>
          </div>

          <div style={{
            background: '#fef3c7', borderRadius: 12,
            padding: '14px 16px', marginBottom: 24,
            fontSize: 13, color: '#92400e', lineHeight: 1.6,
          }}>
            <strong>Step 1:</strong> Make sure you are signed in at{' '}
            <a href="/uk/auth/login" style={{ color: '#92400e', fontWeight: 600 }}>
              /uk/auth/login
            </a>
            <br /><br />
            <strong>Step 2:</strong> Click the button below — you will be redirected to the admin panel.
            <br /><br />
            <strong>Security:</strong> This page stops working once the first admin is created.
          </div>

          <SetupForm />
        </div>
      </div>
    </div>
  )
}
