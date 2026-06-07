-- Subscription intent: store parameters before first payment so the IPN webhook
-- can create the subscription when WayForPay confirms and returns a recToken.
create table subscription_intents (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid not null references customers(id),
  product_id       uuid not null references products(id),
  frequency        text not null,
  fulfillment_type text not null,
  start_date       date not null,
  rec_token        text,
  completed        boolean not null default false,
  created_at       timestamptz not null default now()
);
alter table subscription_intents enable row level security;
create policy "service role all intents" on subscription_intents for all using (auth.role() = 'service_role');

-- Track individual fulfillment dates that a customer has skipped.
-- The billing job checks this before charging.

create table subscription_skips (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  skip_date       date not null,
  created_at      timestamptz not null default now(),
  unique (subscription_id, skip_date)
);

alter table subscription_skips enable row level security;
create policy "customers manage own skips" on subscription_skips for all
  using (
    exists (
      select 1 from subscriptions s
      where s.id = subscription_id and s.customer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from subscriptions s
      where s.id = subscription_id and s.customer_id = auth.uid()
    )
  );
create policy "service role all skips" on subscription_skips for all
  using (auth.role() = 'service_role');

-- Index for billing: find subscriptions due today that aren't skipped
create index subscription_skips_date_idx on subscription_skips(subscription_id, skip_date);
