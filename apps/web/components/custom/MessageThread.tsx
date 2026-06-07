'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { formatDateTime } from '@zakhtsyanka/shared/utils'
import type { CustomRequestMessage } from '@zakhtsyanka/shared/types'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface MessageThreadProps {
  requestId: string
  initialMessages: CustomRequestMessage[]
  lang: SupportedLocale
  canReply: boolean
  guestEmail?: string
}

export function MessageThread({
  requestId, initialMessages, lang, canReply, guestEmail,
}: MessageThreadProps) {
  const isUk = lang === 'uk'
  const [messages,  setMessages]  = useState(initialMessages)
  const [body,      setBody]      = useState('')
  const [pending,   start]        = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for new messages every 10s
  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/custom-requests/${requestId}/messages`)
      if (res.ok) setMessages(await res.json() as CustomRequestMessage[])
    }, 10_000)
    return () => clearInterval(timer)
  }, [requestId])

  function handleSend() {
    if (!body.trim()) return
    start(async () => {
      const res = await fetch(`/api/custom-requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), guestEmail }),
      })
      if (res.ok) {
        const msg = await res.json() as CustomRequestMessage
        setMessages((prev) => [...prev, msg])
        setBody('')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Messages */}
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-4">
            {isUk ? 'Повідомлень ще немає' : 'No messages yet'}
          </p>
        )}
        {messages.map((msg) => {
          const isBakery = msg.authorType === 'bakery'
          return (
            <div key={msg.id} className={`flex gap-2 ${isBakery ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-sm ${isBakery ? 'bg-amber-100' : 'bg-stone-100'}`}>
                {isBakery ? '🥐' : '👤'}
              </div>
              <div className={`max-w-[80%] ${isBakery ? 'items-start' : 'items-end'} flex flex-col gap-1`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${isBakery ? 'bg-amber-50 border border-amber-100 text-stone-800' : 'bg-stone-100 text-stone-800'}`}>
                  {msg.body}
                </div>
                <p className="text-xs text-stone-400">{formatDateTime(msg.createdAt, lang)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {canReply && (
        <div className="flex gap-2 border-t border-stone-100 pt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={isUk ? 'Написати повідомлення…' : 'Write a message…'}
            rows={2}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
          <button
            onClick={handleSend}
            disabled={pending || !body.trim()}
            className="self-end px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            {isUk ? '↑' : '↑'}
          </button>
        </div>
      )}
    </div>
  )
}
