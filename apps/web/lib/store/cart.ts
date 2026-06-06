import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

export interface DeliveryAddress {
  street: string
  city: string
  postalCode: string
}

export interface CartState {
  items: CartItem[]
  orderType: 'pickup' | 'delivery'
  fulfillmentSlot: string | null   // ISO datetime
  deliveryAddress: DeliveryAddress | null
  deliveryFeeCents: number

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setOrderType: (type: 'pickup' | 'delivery') => void
  setFulfillmentSlot: (slot: string | null) => void
  setDeliveryAddress: (address: DeliveryAddress | null) => void
  setDeliveryFee: (cents: number) => void
  clearCart: () => void

  // Derived (computed inline)
  itemCount: () => number
  subtotalCents: () => number
  totalCents: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items:            [],
      orderType:        'pickup',
      fulfillmentSlot:  null,
      deliveryAddress:  null,
      deliveryFeeCents: 0,

      addItem(incoming) {
        set((state) => {
          const existing = state.items.find((i) => i.productId === incoming.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === incoming.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            }
          }
          return { items: [...state.items, { ...incoming, quantity: 1 }] }
        })
      },

      removeItem(productId) {
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }))
      },

      updateQuantity(productId, quantity) {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          ),
        }))
      },

      setOrderType(type) {
        set({ orderType: type, fulfillmentSlot: null })
        // Clear delivery-specific state when switching to pickup
        if (type === 'pickup') {
          set({ deliveryAddress: null, deliveryFeeCents: 0 })
        }
      },

      setFulfillmentSlot: (slot) => set({ fulfillmentSlot: slot }),
      setDeliveryAddress: (address) => set({ deliveryAddress: address }),
      setDeliveryFee:     (cents) => set({ deliveryFeeCents: cents }),
      clearCart: () => set({
        items: [], fulfillmentSlot: null,
        deliveryAddress: null, deliveryFeeCents: 0,
      }),

      itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      subtotalCents() {
        return get().items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)
      },

      totalCents() {
        return get().subtotalCents() + get().deliveryFeeCents
      },
    }),
    {
      name: 'zakhtsyanka-cart',
      // Only persist data fields, not action functions
      partialize: (state) => ({
        items:            state.items,
        orderType:        state.orderType,
        fulfillmentSlot:  state.fulfillmentSlot,
        deliveryAddress:  state.deliveryAddress,
        deliveryFeeCents: state.deliveryFeeCents,
      }),
    },
  ),
)
