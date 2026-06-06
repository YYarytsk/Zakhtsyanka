-- Staff members can read and update all orders (for the kitchen queue).
-- They can also manage the product catalog and store settings.
-- Staff rows are created manually by the bakery owner.

-- ── Orders ────────────────────────────────────────────────────────────────────
create policy "staff read all orders" on orders for select
  using (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff update order status" on orders for update
  using (exists (select 1 from staff where staff.id = auth.uid()));

-- ── Products / categories ─────────────────────────────────────────────────────
create policy "staff manage products" on products for all
  using (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff manage categories" on categories for all
  using (exists (select 1 from staff where staff.id = auth.uid()));

-- ── Store settings ────────────────────────────────────────────────────────────
create policy "staff update store_settings" on store_settings for update
  using (exists (select 1 from staff where staff.id = auth.uid()));

-- ── Custom requests ───────────────────────────────────────────────────────────
create policy "staff read all requests" on custom_requests for select
  using (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff update requests" on custom_requests for update
  using (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff read all messages" on custom_request_messages for select
  using (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff write messages" on custom_request_messages for insert
  with check (exists (select 1 from staff where staff.id = auth.uid()));
