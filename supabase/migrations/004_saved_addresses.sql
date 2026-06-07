-- Saved delivery addresses for logged-in customers.
-- Customers can store multiple addresses; one is marked as default.

create table saved_addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label       text not null,          -- e.g. "Дім", "Робота"
  street      text not null,
  city        text not null,
  postal_code text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index saved_addresses_customer_idx on saved_addresses(customer_id);

alter table saved_addresses enable row level security;
create policy "customers manage own addresses" on saved_addresses for all
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);
create policy "service role all addresses" on saved_addresses for all
  using (auth.role() = 'service_role');

-- Index for fast loyalty history lookups per customer
create index loyalty_customer_idx on loyalty_transactions(customer_id, created_at desc);
