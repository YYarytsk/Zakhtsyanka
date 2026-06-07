-- Birthday date for loyalty rewards
alter table customers add column if not exists birthday_date date;

-- Referral tracking (simple: who referred whom)
alter table customers add column if not exists referred_by uuid references customers(id);
alter table customers add column if not exists referral_code text unique
  generated always as (substring(id::text, 1, 8)) stored;

-- Index for daily birthday cron: find all customers whose birthday is today (any year)
create index customers_birthday_idx on customers (
  extract(month from birthday_date),
  extract(day   from birthday_date)
) where birthday_date is not null;
