-- Partner CRM fields for EKB Flowers internal directory (no approve flow).

ALTER TABLE public.catalog_partners
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS telegram text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS stock_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS flowers_in_stock text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS self_deliver boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_zones text,
  ADD COLUMN IF NOT EXISTS prep_time_note text;

CREATE INDEX IF NOT EXISTS catalog_partners_district_idx
  ON public.catalog_partners (district)
  WHERE district IS NOT NULL;
