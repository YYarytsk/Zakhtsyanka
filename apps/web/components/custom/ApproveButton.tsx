'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface ApproveButtonProps {
  requestId: string
  lang: 'uk' | 'en'
}

export function ApproveButton({ requestId, lang }: ApproveButtonProps) {
  const [pending, start] = useTransition()
  const router = useRouter()

  function handleApprove() {
    start(async () => {
      await fetch(`/api/custom-requests/${requestId}/approve`, { method: 'POST' })
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleApprove}
      disabled={pending}
      className="px-5 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50"
    >
      {pending ? '…' : (lang === 'uk' ? '✓ Підтвердити' : '✓ Approve')}
    </button>
  )
}
