# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace manifests only (cache-friendly layer)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json          ./apps/web/

RUN pnpm install --frozen-lockfile

# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=deps /app/node_modules          ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy full source
COPY . .

# Build args surfaced as env vars at build time (public vars only — no secrets here)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STORE_NAME_UK="Захцянка"
ARG NEXT_PUBLIC_STORE_NAME_EN="Zakhtsyanka"
ARG NEXT_PUBLIC_DEFAULT_LOCALE=uk
ARG NEXT_PUBLIC_WFP_MERCHANT_ACCOUNT
ARG NEXT_PUBLIC_WFP_MERCHANT_DOMAIN

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_STORE_NAME_UK=$NEXT_PUBLIC_STORE_NAME_UK
ENV NEXT_PUBLIC_STORE_NAME_EN=$NEXT_PUBLIC_STORE_NAME_EN
ENV NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE
ENV NEXT_PUBLIC_WFP_MERCHANT_ACCOUNT=$NEXT_PUBLIC_WFP_MERCHANT_ACCOUNT
ENV NEXT_PUBLIC_WFP_MERCHANT_DOMAIN=$NEXT_PUBLIC_WFP_MERCHANT_DOMAIN

WORKDIR /app/apps/web
RUN pnpm build

# ── Stage 3: runner ───────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid  1001 nextjs

# next build --output standalone emits a self-contained server
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=builder /app/apps/web/public           ./apps/web/public

USER nextjs
EXPOSE 3000

# Secret env vars are injected at runtime by Azure Container Apps, not baked in
CMD ["node", "apps/web/server.js"]
