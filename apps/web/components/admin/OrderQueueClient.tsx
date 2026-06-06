'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { OrderCard } from './OrderCard'
import type { Order, OrderStatus } from '@zakhtsyanka/shared/types'

const ACTIVE_STATUSES: OrderStatus[] = ['received', 'preparing', 'ready', 'out_for_delivery']
const POLL_INTERVAL_MS = 15_000

interface OrderQueueClientProps {
  initialOrders: Order[]
}

export function OrderQueueClient({ initialOrders }: OrderQueueClientProps) {
  const [orders,    setOrders]    = useState<Order[]>(initialOrders)
  const [newAlert,  setNewAlert]  = useState(false)
  const [lastCount, setLastCount] = useState(initialOrders.filter((o) => o.status === 'received').length)
  const audioCtx = useRef<AudioContext | null>(null)

  function playBeep() {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext()
      const ctx  = audioCtx.current
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type            = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch { /* AudioContext blocked before user interaction */ }
  }

  const fetchOrders = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/orders/today')
      if (!res.ok) return
      const data = await res.json() as Order[]
      setOrders(data)

      const newCount = data.filter((o) => o.status === 'received').length
      setLastCount((prev) => {
        if (newCount > prev) {
          setNewAlert(true)
          playBeep()
          setTimeout(() => setNewAlert(false), 5000)
        }
        return newCount
      })
    } catch { /* silently ignore network errors during polling */ }
  }, [])

  useEffect(() => {
    const timer = setInterval(fetchOrders, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [fetchOrders])

  const active    = orders.filter((o) => ACTIVE_STATUSES.includes(o.status as OrderStatus))
  const completed = orders.filter((o) => o.status === 'completed' || o.status === 'cancelled')

  const columns: { status: OrderStatus; label: string }[] = [
    { status: 'received',         label: 'Нові замовлення' },
    { status: 'preparing',        label: 'Готуються' },
    { status: 'ready',            label: 'Готово / В дорозі' },
    { status: 'out_for_delivery', label: '' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* New order alert banner */}
      {newAlert && (
        <div className="bg-blue-600 text-white rounded-xl px-5 py-3 text-sm font-semibold flex items-center gap-3 animate-pulse">
          <span className="text-xl">🔔</span>
          Нове замовлення!
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {columns
          .filter((col) => col.label) // skip out_for_delivery (merged with ready)
          .map((col) => {
            const colOrders = active.filter((o) =>
              col.status === 'ready'
                ? o.status === 'ready' || o.status === 'out_for_delivery'
                : o.status === col.status,
            )
            return (
              <div key={col.status}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-stone-700 text-sm">{col.label}</h2>
                  {colOrders.length > 0 && (
                    <span className={[
                      'text-xs font-bold rounded-full px-2 py-0.5',
                      col.status === 'received' ? 'bg-blue-600 text-white' : 'bg-stone-200 text-stone-600',
                    ].join(' ')}>
                      {colOrders.length}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  {colOrders.length === 0 ? (
                    <p className="text-xs text-stone-300 py-4 text-center border border-dashed border-stone-200 rounded-xl">
                      Порожньо
                    </p>
                  ) : (
                    colOrders
                      .sort((a, b) => a.fulfillmentSlot.localeCompare(b.fulfillmentSlot))
                      .map((o) => <OrderCard key={o.id} order={o} />)
                  )}
                </div>
              </div>
            )
          })}
      </div>

      {/* Completed today */}
      {completed.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-stone-400 select-none mb-3">
            Завершені та скасовані ({completed.length})
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-60">
            {completed.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        </details>
      )}

      {active.length === 0 && completed.length === 0 && (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">🥐</p>
          <p className="text-sm">Сьогодні ще немає замовлень</p>
        </div>
      )}
    </div>
  )
}
