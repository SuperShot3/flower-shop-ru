-- Admin-only notes on an order (not shown to customers).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS internal_notes text;

COMMENT ON COLUMN public.orders.internal_notes IS
  'Optional admin-only notes for fulfillment; never exposed on customer order pages.';
