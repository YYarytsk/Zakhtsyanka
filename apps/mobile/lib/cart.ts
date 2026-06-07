import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { FulfillmentType } from '@zakhtsyanka/shared/types'

export interface CartItem {
  productId: string
  slug: string
  nameUk: string
  nameEn: string
  priceCents: number
  quantity: number
  photo: string | null
  fulfillmentTypes: FulfillmentType[]
}

interface CartState {
  items:            CartItem[]
  orderType:        'pickup' | 'delivery'
  fulfillmentSlot:  string | null
  deliveryFeeCents: number

  addItem:          (item: Omit<CartItem, 'quantity'>) => void
  removeItem:       (productId: string) => void
  updateQuantity:   (productId: string, qty: number) => void
  setOrderType:     (type: 'pickup' | 'delivery') => void
  setSlot:          (slot: string | null) => void
  setDeliveryFee:   (cents: number) => void
  clearCart:        () => void
  itemCount:        () => number
  subtotalCents:    () => number
  totalCents:       () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [], orderType: 'pickup', fulfillmentSlot: null, deliveryFeeCents: 0,

      addItem(incoming) {
        set((s) => {
          const existing = s.items.find((i) => i.productId === incoming.productId)
          if (existing) return { items: s.items.map((i) => i.productId === incoming.productId ? { ...i, quantity: i.quantity + 1 } : i) }
          return { items: [...s.items, { ...incoming, quantity: 1 }] }
        })
      },
      removeItem(id)         { set((s) => ({ items: s.items.filter((i) => i.productId !== id) })) },
      updateQuantity(id, qty) {
        if (qty <= 0) { get().removeItem(id); return }
        set((s) => ({ items: s.items.map((i) => i.productId === id ? { ...i, quantity: qty } : i) }))
      },
      setOrderType(type)     { set({ orderType: type, fulfillmentSlot: null }) },
      setSlot(slot)          { set({ fulfillmentSlot: slot }) },
      setDeliveryFee(cents)  { set({ deliveryFeeCents: cents }) },
      clearCart()            { set({ items: [], fulfillmentSlot: null, deliveryFeeCents: 0 }) },
      itemCount()            { return get().items.reduce((s, i) => s + i.quantity, 0) },
      subtotalCents()        { return get().items.reduce((s, i) => s + i.priceCents * i.quantity, 0) },
      totalCents()           { return get().subtotalCents() + get().deliveryFeeCents },
    }),
    {
      name:    'zakhtsyanka-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ items: s.items, orderType: s.orderType, fulfillmentSlot: s.fulfillmentSlot, deliveryFeeCents: s.deliveryFeeCents }),
    },
  ),
)
