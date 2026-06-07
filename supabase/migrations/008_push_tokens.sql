-- Expo push token stored per customer for mobile push notifications.
-- Tokens are device-specific and should be refreshed on each app launch.
alter table customers add column if not exists push_token text;
