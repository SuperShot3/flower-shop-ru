-- Drop unused partner social profile columns (legacy).

ALTER TABLE public.partner_applications
  DROP COLUMN IF EXISTS instagram,
  DROP COLUMN IF EXISTS facebook;
