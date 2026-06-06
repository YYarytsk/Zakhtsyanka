export type Locale = 'uk' | 'en'

// ── Localized string pair ──────────────────────────────────────────────────
export interface LocalizedString {
  uk: string
  en: string
}

// ── Store settings ─────────────────────────────────────────────────────────
export interface StoreHours {
  open: string  // "09:00"
  close: string // "18:00"
}

export interface DeliveryZone {
  id: string
  label: string
  postalCodes?: string[]
  radiusKm?: number
  feeCents: number
}

export interface StoreSettings {
  id: string
  nameUk: string
  nameEn: string
  leadTimePickupHours: number
  leadTimeDeliveryHours: number
  hours: Record<string, StoreHours | null> // "mon"–"sun", null = closed
  deliveryZones: DeliveryZone[]
  holidayClosures: string[]               // ISO date strings
  ordersPaused: boolean
  announcementUk: string | null
  announcementEn: string | null
}

// ── Product & catalog ──────────────────────────────────────────────────────
export type FulfillmentType = 'pickup' | 'delivery' | 'preorder'
export type DietaryTag = 'vegan' | 'vegetarian' | 'gluten-free' | 'nut-free' | 'dairy-free'

export interface Category {
  id: string
  slug: string
  nameUk: string
  nameEn: string
  sortOrder: number
}

export interface Product {
  id: string
  categoryId: string
  category?: Category
  nameUk: string
  nameEn: string
  descriptionUk: string
  descriptionEn: string
  allergensUk: string | null
  allergensEn: string | null
  priceCents: number
  photos: string[]
  dietaryTags: DietaryTag[]
  fulfillmentTypes: FulfillmentType[]
  dailyCap: number | null  // null = unlimited
  isAvailable: boolean
  slug: string
  createdAt: string
}

// ── Customer ───────────────────────────────────────────────────────────────
export interface Customer {
  id: string
  email: string
  preferredLanguage: Locale
  wfpRectoken: string | null  // WayForPay saved card token for repeat payments
  loyaltyBalancePoints: number
  createdAt: string
}

export interface SavedAddress {
  id: string
  customerId: string
  label: string
  street: string
  city: string
  postalCode: string
  isDefault: boolean
}

// ── Orders ─────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending_payment'
  | 'received'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'

export type OrderType = 'pickup' | 'delivery'

export interface OrderLineItem {
  productId: string
  nameUk: string
  nameEn: string
  priceCents: number
  quantity: number
}

export interface Order {
  id: string
  customerId: string | null
  guestEmail: string | null
  type: OrderType
  status: OrderStatus
  fulfillmentSlot: string   // ISO datetime
  deliveryAddress: DeliveryAddress | null
  lineItems: OrderLineItem[]
  subtotalCents: number
  deliveryFeeCents: number
  totalCents: number
  wfpOrderReference: string | null
  customerLanguage: Locale
  createdAt: string
}

export interface DeliveryAddress {
  street: string
  city: string
  postalCode: string
}

// ── Custom requests ─────────────────────────────────────────────────────────
export type CustomRequestStatus =
  | 'submitted'
  | 'quoted'
  | 'approved'
  | 'deposit_paid'
  | 'scheduled'
  | 'completed'
  | 'cancelled'

export interface CustomRequest {
  id: string
  customerId: string | null
  guestEmail: string | null
  occasion: string
  servings: number
  flavors: string
  dietaryNeeds: string | null
  dateNeeded: string  // ISO date
  referencePhotos: string[]
  budgetCents: number | null
  notes: string | null
  status: CustomRequestStatus
  quoteCents: number | null
  depositCents: number | null
  wfpDepositOrderReference: string | null
  customerLanguage: Locale
  createdAt: string
}

export interface CustomRequestMessage {
  id: string
  requestId: string
  authorType: 'customer' | 'bakery'
  body: string
  createdAt: string
}

// ── Subscriptions ──────────────────────────────────────────────────────────
export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'

export interface Subscription {
  id: string
  customerId: string
  productId: string
  product?: Product
  frequency: SubscriptionFrequency
  fulfillmentType: FulfillmentType
  nextFulfillmentDate: string  // ISO date
  status: SubscriptionStatus
  wfpRectokenLifetime: string | null  // WayForPay recurrent token for subscription billing
  createdAt: string
}

// ── Loyalty ────────────────────────────────────────────────────────────────
export type LoyaltyTransactionReason =
  | 'order_earned'
  | 'reward_redeemed'
  | 'referral_bonus'
  | 'birthday_bonus'
  | 'manual_adjustment'

export interface LoyaltyTransaction {
  id: string
  customerId: string
  points: number       // positive = earned, negative = spent
  reason: LoyaltyTransactionReason  // code — translated at display time
  orderId: string | null
  createdAt: string
}

// ── Time slots ─────────────────────────────────────────────────────────────
export interface TimeSlot {
  datetime: string   // ISO datetime (slot start)
  available: boolean
  remainingCapacity: number | null
}
