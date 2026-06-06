'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteProductButtonProps {
  productId: string
}

export function DeleteProductButton({ productId }: DeleteProductButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  async function handleDelete() {
    if (!confirm('Видалити цей товар?')) return
    startTransition(async () => {
      await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
    >
      {pending ? '…' : 'Видалити'}
    </button>
  )
}
