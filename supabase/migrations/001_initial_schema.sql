-- ─────────────────────────────────────────────────────────────────────────────
-- 001_initial_schema.sql
-- Phase 0 schema: all entities, RLS enabled on every table,
-- localized text stored as language-specific columns (uk/en).
-- Statuses stored as codes — NEVER as translated text.
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";    -- full-text search across both language columns

-- ── Store settings (single row) ───────────────────────────────────────────
create table store_settings (
  id                       uuid primary key default gen_random_uuid(),
  name_uk                  text not null default 'Захцянка',
  name_en                  text not null default 'Zakhtsyanka',
  lead_time_pickup_hours   int  not null default 2,
  lead_time_delivery_hours int  not null default 24,
  hours                    jsonb not null default '{
    "mon": {"open": "09:00", "close": "18:00"},
    "tue": {"open": "09:00", "close": "18:00"},
    "wed": {"open": "09:00", "close": "18:00"},
    "thu": {"open": "09:00", "close": "18:00"},
    "fri": {"open": "09:00", "close": "18:00"},
    "sat": {"open": "10:00", "close": "16:00"},
    "sun": null
  }',
  delivery_zones           jsonb not null default '[]',
  holiday_closures         date[] not null default '{}',
  orders_paused            boolean not null default false,
  announcement_uk          text,
  announcement_en          text,
  created_at               timestamptz not null default now()
);

-- Seed the single settings row
insert into store_settings default values;

-- RLS: public read; only service role can write
alter table store_settings enable row level security;
create policy "public read store_settings"  on store_settings for select using (true);
create policy "service role write store_settings" on store_settings for all using (auth.role() = 'service_role');

-- ── Categories ────────────────────────────────────────────────────────────
create table categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name_uk    text not null,
  name_en    text not null,
  sort_order int  not null default 0
);

alter table categories enable row level security;
create policy "public read categories" on categories for select using (true);
create policy "service role write categories" on categories for all using (auth.role() = 'service_role');

insert into categories (slug, name_uk, name_en, sort_order) values
  ('bread',      'Хліб',        'Bread',      1),
  ('pastries',   'Випічка',     'Pastries',   2),
  ('cakes',      'Торти',       'Cakes',      3),
  ('seasonal',   'Сезонне',     'Seasonal',   4);

-- ── Products ──────────────────────────────────────────────────────────────
create table products (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid not null references categories(id),
  slug             text unique not null,
  name_uk          text not null,
  name_en          text not null,
  description_uk   text not null default '',
  description_en   text not null default '',
  allergens_uk     text,
  allergens_en     text,
  price_cents      int  not null check (price_cents > 0),
  photos           text[] not null default '{}',
  dietary_tags     text[] not null default '{}',
  fulfillment_types text[] not null default '{"pickup"}',
  daily_cap        int   check (daily_cap > 0),    -- null = unlimited
  is_available     boolean not null default true,
  created_at       timestamptz not null default now(),
  -- GIN index columns for bilingual full-text search
  search_vector    tsvector generated always as (
    to_tsvector('simple', coalesce(name_uk,'') || ' ' || coalesce(name_en,'') || ' ' ||
                          coalesce(description_uk,'') || ' ' || coalesce(description_en,''))
  ) stored
);

create index products_search_idx on products using gin(search_vector);
create index products_category_idx on products(category_id);
create index products_available_idx on products(is_available);

alter table products enable row level security;
create policy "public read available products" on products for select using (is_available = true);
create policy "service role all products" on products for all using (auth.role() = 'service_role');

-- ── Customers ─────────────────────────────────────────────────────────────
create table customers (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null,
  preferred_language    text not null default 'uk' check (preferred_language in ('uk', 'en')),
  wfp_rectoken    text unique,
  loyalty_balance_points int not null default 0 check (loyalty_balance_points >= 0),
  created_at            timestamptz not null default now()
);

alter table customers enable row level security;
create policy "customers read own row"   on customers for select using (auth.uid() = id);
create policy "customers update own row" on customers for update using (auth.uid() = id);
create policy "service role all customers" on customers for all using (auth.role() = 'service_role');

-- Auto-create customer row on auth sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.customers (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Orders ────────────────────────────────────────────────────────────────
create table orders (
  id                       uuid primary key default gen_random_uuid(),
  customer_id              uuid references customers(id),
  guest_email              text,
  type                     text not null check (type in ('pickup', 'delivery')),
  status                   text not null default 'received'
                             check (status in ('received','preparing','ready','out_for_delivery','completed','cancelled')),
  fulfillment_slot         timestamptz not null,
  delivery_address         jsonb,
  line_items               jsonb not null,
  subtotal_cents           int  not null check (subtotal_cents >= 0),
  delivery_fee_cents       int  not null default 0 check (delivery_fee_cents >= 0),
  total_cents              int  not null check (total_cents >= 0),
  wfp_order_reference text unique,
  customer_language        text not null default 'uk' check (customer_language in ('uk', 'en')),
  created_at               timestamptz not null default now(),
  -- Either a logged-in customer or a guest email, never both null
  constraint customer_or_guest check (customer_id is not null or guest_email is not null)
);

create index orders_customer_idx      on orders(customer_id);
create index orders_status_idx        on orders(status);
create index orders_fulfillment_idx   on orders(fulfillment_slot);

alter table orders enable row level security;
create policy "customers read own orders" on orders for select
  using (auth.uid() = customer_id);
create policy "service role all orders" on orders for all using (auth.role() = 'service_role');

-- ── Custom requests ────────────────────────────────────────────────────────
create table custom_requests (
  id                     uuid primary key default gen_random_uuid(),
  customer_id            uuid references customers(id),
  guest_email            text,
  occasion               text not null,
  servings               int  not null check (servings > 0),
  flavors                text not null,
  dietary_needs          text,
  date_needed            date not null,
  reference_photos       text[] not null default '{}',
  budget_cents           int   check (budget_cents > 0),
  notes                  text,
  status                 text not null default 'submitted'
                           check (status in ('submitted','quoted','approved','deposit_paid','scheduled','completed','cancelled')),
  quote_cents            int   check (quote_cents > 0),
  deposit_cents          int   check (deposit_cents > 0),
  wfp_deposit_order_reference text,
  customer_language      text not null default 'uk' check (customer_language in ('uk', 'en')),
  created_at             timestamptz not null default now(),
  constraint customer_or_guest check (customer_id is not null or guest_email is not null)
);

alter table custom_requests enable row level security;
create policy "customers read own requests" on custom_requests for select
  using (auth.uid() = customer_id);
create policy "service role all requests" on custom_requests for all using (auth.role() = 'service_role');

create table custom_request_messages (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references custom_requests(id) on delete cascade,
  author_type text not null check (author_type in ('customer', 'bakery')),
  body        text not null,
  created_at  timestamptz not null default now()
);

alter table custom_request_messages enable row level security;
create policy "customers read own messages" on custom_request_messages for select
  using (
    exists (
      select 1 from custom_requests r
      where r.id = request_id and r.customer_id = auth.uid()
    )
  );
create policy "service role all messages" on custom_request_messages for all using (auth.role() = 'service_role');

-- ── Subscriptions ─────────────────────────────────────────────────────────
create table subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references customers(id),
  product_id            uuid not null references products(id),
  frequency             text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  fulfillment_type      text not null check (fulfillment_type in ('pickup', 'delivery', 'preorder')),
  next_fulfillment_date date not null,
  status                text not null default 'active'
                          check (status in ('active', 'paused', 'cancelled')),
  wfp_rectoken_lifetime text,
  created_at            timestamptz not null default now()
);

alter table subscriptions enable row level security;
create policy "customers read own subscriptions" on subscriptions for select
  using (auth.uid() = customer_id);
create policy "service role all subscriptions" on subscriptions for all using (auth.role() = 'service_role');

-- ── Loyalty transactions ───────────────────────────────────────────────────
create table loyalty_transactions (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  points      int  not null,                        -- positive = earned, negative = spent
  reason      text not null                         -- stored as code, translated at display time
                check (reason in ('order_earned','reward_redeemed','referral_bonus','birthday_bonus','manual_adjustment')),
  order_id    uuid references orders(id),
  created_at  timestamptz not null default now()
);

alter table loyalty_transactions enable row level security;
create policy "customers read own loyalty" on loyalty_transactions for select
  using (auth.uid() = customer_id);
create policy "service role all loyalty" on loyalty_transactions for all using (auth.role() = 'service_role');

-- ── Staff / admin ─────────────────────────────────────────────────────────
create table staff (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'staff' check (role in ('staff', 'admin')),
  created_at timestamptz not null default now()
);

alter table staff enable row level security;
create policy "staff read own row" on staff for select using (auth.uid() = id);
create policy "service role all staff" on staff for all using (auth.role() = 'service_role');
