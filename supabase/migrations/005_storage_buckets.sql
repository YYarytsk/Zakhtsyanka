-- Storage buckets for file uploads.
-- Run this AFTER creating the buckets in the Supabase Dashboard:
--   Storage → New bucket → "product-photos"      (public: true)
--   Storage → New bucket → "custom-request-photos" (public: false)
--
-- Then run these RLS policies:

-- Product photos: public read, staff/service-role write
insert into storage.buckets (id, name, public) values
  ('product-photos', 'product-photos', true),
  ('custom-request-photos', 'custom-request-photos', false)
on conflict (id) do nothing;

-- Public read for product photos
create policy "public read product photos"
  on storage.objects for select
  using (bucket_id = 'product-photos');

-- Staff/service-role can upload product photos
create policy "staff upload product photos"
  on storage.objects for insert
  with check (
    bucket_id = 'product-photos' AND (
      auth.role() = 'service_role' OR
      exists (select 1 from public.staff where id = auth.uid())
    )
  );

-- Customers can upload their own custom-request photos
create policy "customers upload request photos"
  on storage.objects for insert
  with check (
    bucket_id = 'custom-request-photos' AND
    auth.uid() is not null
  );

-- Customers/staff can read custom-request photos
create policy "authenticated read request photos"
  on storage.objects for select
  using (
    bucket_id = 'custom-request-photos' AND (
      auth.uid() is not null OR
      auth.role() = 'service_role'
    )
  );
