import 'server-only'
import { createHmac } from 'node:crypto'

// ── WayForPay API docs: https://wiki.wayforpay.com/en/view/852102 ─────────────

const MERCHANT_ACCOUNT = process.env.NEXT_PUBLIC_WFP_MERCHANT_ACCOUNT!
const MERCHANT_SECRET  = process.env.WFP_MERCHANT_SECRET_KEY!
const MERCHANT_DOMAIN  = process.env.NEXT_PUBLIC_WFP_MERCHANT_DOMAIN!
const API_URL          = 'https://api.wayforpay.com/api'

// HMAC-SHA1 over a semicolon-separated string of values (WayForPay's signature scheme)
function sign(fields: (string | number)[]): string {
  return createHmac('sha1', MERCHANT_SECRET)
    .update(fields.join(';'))
    .digest('hex')
}

// ── One-time payment ──────────────────────────────────────────────────────────

export interface WfpPurchaseParams {
  orderReference: string         // your unique order ID
  orderDate: number              // Unix timestamp (seconds)
  amountCents: number
  currency: 'UAH'
  productNames: string[]         // one entry per line item
  productCounts: number[]
  productPriceCents: number[]
  clientEmail: string
  clientFirstName?: string
  returnUrl: string              // redirect after payment completes
  serviceUrl: string             // IPN webhook URL
}

export interface WfpPurchasePayload {
  merchantAccount: string
  merchantDomainName: string
  orderReference: string
  orderDate: number
  amount: number
  currency: string
  productName: string[]
  productCount: number[]
  productPrice: number[]
  clientEmail: string
  clientFirstName?: string
  returnUrl: string
  serviceUrl: string
  merchantSignature: string
}

export function buildPurchasePayload(params: WfpPurchaseParams): WfpPurchasePayload {
  const amount  = params.amountCents / 100
  const prices  = params.productPriceCents.map((c) => c / 100)

  // Signature fields per WayForPay docs (purchase transaction)
  const signFields = [
    MERCHANT_ACCOUNT,
    MERCHANT_DOMAIN,
    params.orderReference,
    params.orderDate,
    amount,
    params.currency,
    ...params.productNames,
    ...params.productCounts,
    ...prices,
  ]

  return {
    merchantAccount:     MERCHANT_ACCOUNT,
    merchantDomainName:  MERCHANT_DOMAIN,
    orderReference:      params.orderReference,
    orderDate:           params.orderDate,
    amount,
    currency:            params.currency,
    productName:         params.productNames,
    productCount:        params.productCounts,
    productPrice:        prices,
    clientEmail:         params.clientEmail,
    ...(params.clientFirstName ? { clientFirstName: params.clientFirstName } : {}),
    returnUrl:           params.returnUrl,
    serviceUrl:          params.serviceUrl,
    merchantSignature:   sign(signFields),
  }
}

// ── Verify incoming IPN (webhook) signature ───────────────────────────────────

export interface WfpIpnBody {
  merchantAccount: string
  orderReference: string
  amount: string | number
  currency: string
  authCode: string
  cardPan: string
  transactionStatus: string
  reasonCode: string
  merchantSignature: string
  [key: string]: unknown
}

export function verifyIpnSignature(body: WfpIpnBody): boolean {
  const expected = sign([
    body.merchantAccount,
    body.orderReference,
    body.amount,
    body.currency,
    body.authCode,
    body.cardPan,
    body.transactionStatus,
    body.reasonCode,
  ])
  return expected === body.merchantSignature
}

// ── Recurrent / subscription charge ──────────────────────────────────────────
// After the first payment, WayForPay returns a recToken that can be charged again.

export interface WfpRecurrentParams {
  orderReference: string
  orderDate: number
  amountCents: number
  currency: 'UAH'
  recToken: string               // token saved from the first transaction
  productNames: string[]
  productCounts: number[]
  productPriceCents: number[]
}

export async function chargeRecurrent(params: WfpRecurrentParams): Promise<{ success: boolean; transactionStatus?: string; reason?: string }> {
  const amount  = params.amountCents / 100
  const prices  = params.productPriceCents.map((c) => c / 100)

  const signFields = [
    MERCHANT_ACCOUNT,
    MERCHANT_DOMAIN,
    params.orderReference,
    params.orderDate,
    amount,
    params.currency,
    ...params.productNames,
    ...params.productCounts,
    ...prices,
  ]

  const payload = {
    transactionType:    'CHARGE',
    merchantAccount:    MERCHANT_ACCOUNT,
    merchantDomainName: MERCHANT_DOMAIN,
    orderReference:     params.orderReference,
    orderDate:          params.orderDate,
    amount,
    currency:           params.currency,
    productName:        params.productNames,
    productCount:       params.productCounts,
    productPrice:       prices,
    recToken:           params.recToken,
    merchantSignature:  sign(signFields),
  }

  const res = await fetch(API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })

  if (!res.ok) return { success: false, reason: `HTTP ${res.status}` }

  const data = (await res.json()) as { transactionStatus?: string; reason?: string }
  return {
    success:           data.transactionStatus === 'Approved',
    transactionStatus: data.transactionStatus,
    reason:            data.reason,
  }
}
