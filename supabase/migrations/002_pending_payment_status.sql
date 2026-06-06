-- Add pending_payment as a valid order status.
-- Orders are created in this state before WayForPay confirms payment.
-- The IPN webhook moves them to 'received'.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending_payment',
    'received',
    'preparing',
    'ready',
    'out_for_delivery',
    'completed',
    'cancelled'
  ));

-- Clean up any orphaned pending_payment rows older than 2 hours
-- (run as a scheduled job once cron is set up)
-- DELETE FROM orders WHERE status = 'pending_payment' AND created_at < now() - interval '2 hours';
