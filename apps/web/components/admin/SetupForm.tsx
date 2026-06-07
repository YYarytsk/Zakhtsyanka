'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SetupForm() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [status,  setStatus] = useState<'idle' | 'checking' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSetup() {
    setStatus('checking')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setStatus('error')
      setMessage('Not signed in. Please sign in first at /uk/auth/login, then come back here.')
      return
    }

    start(async () => {
      const res  = await fetch('/api/admin/setup', { method: 'POST' })
      const data = await res.json() as { ok?: boolean; error?: string; email?: string }

      if (res.ok && data.ok) {
        setStatus('done')
        setMessage(`✓ Акаунт адміна створено для ${data.email}. Переходимо до адмін-панелі…`)
        setTimeout(() => router.replace('/admin/orders'), 2000)
      } else if (res.status === 409) {
        // Already set up — just redirect
        setStatus('done')
        setMessage('Адмін вже налаштований. Переходимо…')
        setTimeout(() => router.replace('/admin/orders'), 1500)
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Щось пішло не так.')
      }
    })
  }

  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '14px', borderRadius: 999,
    background: status === 'done' ? '#16a34a' : '#d97706',
    color: '#fff', fontWeight: 700, fontSize: 15,
    border: 'none', cursor: pending ? 'not-allowed' : 'pointer',
    opacity: pending ? 0.6 : 1,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, fontSize: 14,
          background: status === 'error' ? '#fee2e2' : '#dcfce7',
          color: status === 'error' ? '#b91c1c' : '#166534',
        }}>
          {message}
        </div>
      )}

      <button onClick={handleSetup} disabled={pending || status === 'done'} style={btnStyle}>
        {pending         ? 'Налаштовуємо…'
          : status === 'done' ? '✓ Готово!'
          : 'Зробити мене адміном / Make me admin'}
      </button>

      <p style={{ fontSize: 12, color: '#a8a29e', textAlign: 'center', margin: 0 }}>
        Ця кнопка спрацює лише якщо ви вже увійшли в акаунт.<br />
        This button only works if you are already signed in.
      </p>
    </div>
  )
}
