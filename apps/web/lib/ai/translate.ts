import 'server-only'

// ── Anthropic Claude API (server-side only — key never reaches the client) ───
//
// Usage: set ANTHROPIC_API_KEY in env vars.
// Calls are always server-side; this file imports 'server-only' to enforce that.
// ALLERGEN text is NEVER sent through AI — bakery must enter it manually.

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5'  // fast + cheap for short translation tasks

export interface ProductTranslationInput {
  nameUk: string
  descriptionUk: string
  // allergensUk is intentionally excluded — food safety, never AI-generated
}

export interface ProductTranslationOutput {
  nameEn: string
  descriptionEn: string
  note?: string
}

export async function draftProductTranslation(
  input: ProductTranslationInput,
): Promise<ProductTranslationOutput> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return { nameEn: '', descriptionEn: '', note: 'ANTHROPIC_API_KEY not set' }
  }

  const prompt = `You are a professional translator for a Ukrainian bakery.
Translate the following product details from Ukrainian to English.
Keep the tone warm and appetising. Keep it concise.
Respond ONLY with valid JSON — no markdown, no explanation.

Product name (Ukrainian): ${input.nameUk}
Product description (Ukrainian): ${input.descriptionUk}

Respond with:
{"nameEn":"...","descriptionEn":"..."}`

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key':         key,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 512,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json() as {
    content: Array<{ type: string; text: string }>
  }

  const text = data.content.find((b) => b.type === 'text')?.text ?? '{}'
  const parsed = JSON.parse(text) as Partial<ProductTranslationOutput>

  return {
    nameEn:        parsed.nameEn        ?? '',
    descriptionEn: parsed.descriptionEn ?? '',
  }
}

// ── Announcement translation ──────────────────────────────────────────────────

export async function draftAnnouncementTranslation(uk: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return ''

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 256,
      messages:   [{
        role: 'user',
        content: `Translate this bakery announcement from Ukrainian to English. Return ONLY the translated text, nothing else.\n\n${uk}`,
      }],
    }),
  })

  if (!res.ok) return ''
  const data = await res.json() as { content: Array<{ type: string; text: string }> }
  return data.content.find((b) => b.type === 'text')?.text?.trim() ?? ''
}
