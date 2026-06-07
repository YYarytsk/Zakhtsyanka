-- Public gallery of showcase cakes and baked goods.
-- Admin curates which completed custom orders (or standalone shots) appear here.

create table gallery (
  id           uuid primary key default gen_random_uuid(),
  caption_uk   text not null,
  caption_en   text not null,
  photos       text[] not null default '{}',
  tags         text[] not null default '{}',    -- e.g. 'wedding', 'birthday', 'chocolate'
  is_published boolean not null default true,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);

create index gallery_published_idx on gallery(is_published, sort_order);

alter table gallery enable row level security;
create policy "public read published gallery" on gallery for select
  using (is_published = true);
create policy "staff manage gallery" on gallery for all
  using (exists (select 1 from staff where id = auth.uid()))
  with check (exists (select 1 from staff where id = auth.uid()));
create policy "service role all gallery" on gallery for all
  using (auth.role() = 'service_role');
