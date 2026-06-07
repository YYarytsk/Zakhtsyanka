import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/uk')

  // Check staff table
  const { data: staff } = await supabase
    .from('staff')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!staff) redirect('/uk')

  return (
    <html lang="uk">
      <body className="min-h-screen flex bg-stone-50">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 bg-white border-r border-stone-200 flex flex-col">
          <div className="p-4 border-b border-stone-200">
            <p className="font-bold text-amber-700 text-sm">Захцянка · Адмін</p>
          </div>
          <nav className="flex flex-col gap-1 p-3 flex-1">
            {[
              { href: '/admin/orders',          label: 'Замовлення' },
              { href: '/admin/catalog',         label: 'Каталог' },
              { href: '/admin/custom-requests', label: 'Інд. торти' },
              { href: '/admin/subscriptions',   label: 'Підписки' },
              { href: '/admin/reports',         label: 'Звіти' },
              { href: '/admin/settings',        label: 'Налаштування' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href as any}
                className="px-3 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-stone-200">
            <p className="text-xs text-stone-400 truncate">{user.email}</p>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 p-6">{children}</main>
      </body>
    </html>
  )
}
