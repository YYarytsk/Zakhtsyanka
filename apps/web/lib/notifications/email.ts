import 'server-only'
import type { Order } from '@zakhtsyanka/shared/types'
import { formatPrice, formatDateTime } from '@zakhtsyanka/shared/utils'

const RESEND_API = 'https://api.resend.com/emails'
const FROM       = process.env.NOTIFICATION_FROM_EMAIL ?? 'noreply@example.com'

async function send(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', to)
    return
  }
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('[email] Resend error', res.status, body)
  }
}

// ── Shared layout ─────────────────────────────────────────────────────────────

function layout(content: string, storeName: string): string {
  return `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f5f5f4;font-family:system-ui,sans-serif;color:#1c1917}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4}
  .header{background:#d97706;padding:24px 32px}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:700}
  .body{padding:32px}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5f5f4;font-size:14px}
  .total{font-weight:700;font-size:16px;color:#d97706}
  .badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;background:#fef3c7;color:#92400e}
  .footer{padding:16px 32px;background:#f5f5f4;font-size:12px;color:#78716c;text-align:center}
</style></head>
<body><div class="wrap">
  <div class="header"><h1>${storeName}</h1></div>
  <div class="body">${content}</div>
  <div class="footer">${storeName} &mdash; дякуємо за замовлення!</div>
</div></body></html>`
}

// ── Templates ─────────────────────────────────────────────────────────────────

function buildConfirmationHtml(order: Order, lang: 'uk' | 'en', storeName: string): string {
  const isUk = lang === 'uk'
  const slot = formatDateTime(order.fulfillmentSlot, lang)
  const itemRows = order.lineItems
    .map((item) => {
      const name = isUk ? item.nameUk : item.nameEn
      return `<div class="row"><span>${name} × ${item.quantity}</span><span>${formatPrice(item.priceCents * item.quantity, lang)}</span></div>`
    })
    .join('')

  const content = isUk ? `
    <h2 style="margin-top:0">Замовлення прийнято!</h2>
    <p>Дякуємо за ваше замовлення. Ми вже готуємо його для вас.</p>
    <p><span class="badge">${order.type === 'pickup' ? 'Самовивіз' : 'Доставка'}</span> &nbsp; ${slot}</p>
    ${itemRows}
    <div class="row total"><span>Разом</span><span>${formatPrice(order.totalCents, lang)}</span></div>
    <p style="margin-top:24px;font-size:13px;color:#78716c">Номер замовлення: <strong>${order.id.slice(0, 8).toUpperCase()}</strong></p>
  ` : `
    <h2 style="margin-top:0">Order received!</h2>
    <p>Thank you for your order. We're already working on it.</p>
    <p><span class="badge">${order.type === 'pickup' ? 'Pickup' : 'Delivery'}</span> &nbsp; ${slot}</p>
    ${itemRows}
    <div class="row total"><span>Total</span><span>${formatPrice(order.totalCents, lang)}</span></div>
    <p style="margin-top:24px;font-size:13px;color:#78716c">Order ID: <strong>${order.id.slice(0, 8).toUpperCase()}</strong></p>
  `

  return layout(content, storeName)
}

function buildStatusUpdateHtml(order: Order, lang: 'uk' | 'en', storeName: string): string {
  const isUk = lang === 'uk'
  const statusLabels: Record<string, { uk: string; en: string }> = {
    preparing:        { uk: 'Готуємо',       en: 'Preparing your order' },
    ready:            { uk: 'Готово!',        en: 'Ready for pickup!' },
    out_for_delivery: { uk: 'В дорозі',       en: 'On its way to you' },
    completed:        { uk: 'Виконано',       en: 'Completed' },
  }

  const label = statusLabels[order.status]
  if (!label) return ''

  const statusText = isUk ? label.uk : label.en
  const content = isUk ? `
    <h2 style="margin-top:0">${statusText}</h2>
    <p>Статус вашого замовлення оновлено.</p>
    <p style="font-size:13px;color:#78716c">Замовлення №${order.id.slice(0, 8).toUpperCase()}</p>
  ` : `
    <h2 style="margin-top:0">${statusText}</h2>
    <p>Your order status has been updated.</p>
    <p style="font-size:13px;color:#78716c">Order #${order.id.slice(0, 8).toUpperCase()}</p>
  `

  return layout(content, storeName)
}

// ── Public helpers ─────────────────────────────────────────────────────────────

export async function sendOrderConfirmation(order: Order, storeName: string): Promise<void> {
  const to   = order.guestEmail ?? ''
  const lang = order.customerLanguage
  if (!to) return

  const subject = lang === 'uk'
    ? `Замовлення прийнято — ${storeName}`
    : `Order confirmed — ${storeName}`

  await send(to, subject, buildConfirmationHtml(order, lang, storeName))
}

export async function sendOrderStatusUpdate(order: Order, storeName: string): Promise<void> {
  const to   = order.guestEmail ?? ''
  const lang = order.customerLanguage
  if (!to) return

  const html = buildStatusUpdateHtml(order, lang, storeName)
  if (!html) return   // no template for this status

  const statusLabels: Record<string, { uk: string; en: string }> = {
    preparing:        { uk: 'Готуємо ваше замовлення',    en: 'Preparing your order' },
    ready:            { uk: 'Ваше замовлення готове!',     en: 'Your order is ready!' },
    out_for_delivery: { uk: 'Ваше замовлення в дорозі',   en: 'Your order is on its way' },
    completed:        { uk: 'Замовлення виконано',         en: 'Order completed' },
  }

  const label = statusLabels[order.status]
  const subject = label ? (lang === 'uk' ? label.uk : label.en) : 'Order update'

  await send(to, `${subject} — ${storeName}`, html)
}
