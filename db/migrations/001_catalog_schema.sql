-- Yandex Managed PostgreSQL — catalog MVP schema (subset of Thailand Supabase catalog).
-- No Supabase auth.users FK; no RLS (app uses DATABASE_URL directly).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Partners
CREATE TABLE IF NOT EXISTS public.catalog_partners (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_sanity_id    text UNIQUE,
  shop_name           text NOT NULL,
  contact_name        text NOT NULL,
  phone_number        text NOT NULL,
  line_or_whatsapp    text,
  shop_address        text,
  shop_bio_en         text,
  shop_bio_th         text,
  portrait            jsonb,
  city                text NOT NULL DEFAULT 'Moscow',
  status              text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'disabled')),
  supabase_user_id    uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalog_partners_status_idx ON public.catalog_partners (status);

-- Bouquets
CREATE TABLE IF NOT EXISTS public.catalog_bouquets (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_sanity_id                text UNIQUE,
  partner_id                      uuid REFERENCES public.catalog_partners(id) ON DELETE SET NULL,
  slug_en                         text NOT NULL,
  slug_th                         text,
  name_en                         text NOT NULL,
  name_th                         text NOT NULL DEFAULT '',
  description_en                  text NOT NULL DEFAULT '',
  description_th                  text NOT NULL DEFAULT '',
  composition_en                  text NOT NULL DEFAULT '',
  composition_th                  text NOT NULL DEFAULT '',
  product_kind                    text NOT NULL DEFAULT 'legacy'
    CHECK (product_kind IN ('legacy', 'single_stem_count', 'fixed_bouquet', 'customizable_bouquet')),
  pricing                         jsonb NOT NULL DEFAULT '{"sizes":[]}'::jsonb,
  status                          text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending_review', 'approved', 'rejected')),
  featured_popular                boolean NOT NULL DEFAULT false,
  discount_percent                smallint
    CHECK (discount_percent IS NULL OR (discount_percent >= 1 AND discount_percent <= 90)),
  delivery_options                text[] NOT NULL DEFAULT '{}',
  excluded_delivery_destinations  text[] NOT NULL DEFAULT '{}',
  presentation_formats            text[] NOT NULL DEFAULT '{}',
  colors                          text[] NOT NULL DEFAULT '{}',
  flower_types                    text[] NOT NULL DEFAULT '{}',
  occasion                        text[] NOT NULL DEFAULT '{}',
  images                          jsonb NOT NULL DEFAULT '[]'::jsonb,
  source                          text,
  created_by                      text,
  approved_by                     text,
  approved_at                     timestamptz,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_bouquets_slug_en_key UNIQUE (slug_en)
);

CREATE INDEX IF NOT EXISTS catalog_bouquets_status_idx ON public.catalog_bouquets (status);
CREATE INDEX IF NOT EXISTS catalog_bouquets_partner_id_idx ON public.catalog_bouquets (partner_id);

-- Products (non-flower add-ons)
CREATE TABLE IF NOT EXISTS public.catalog_products (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_sanity_id                text UNIQUE,
  partner_id                      uuid NOT NULL REFERENCES public.catalog_partners(id) ON DELETE RESTRICT,
  slug_en                         text NOT NULL,
  slug_th                         text,
  name_en                         text NOT NULL,
  name_th                         text NOT NULL DEFAULT '',
  description_en                  text NOT NULL DEFAULT '',
  description_th                  text NOT NULL DEFAULT '',
  category                        text NOT NULL,
  price                           numeric(12,2) NOT NULL CHECK (price >= 0),
  cost                            numeric(12,2) CHECK (cost IS NULL OR cost >= 0),
  commission_percent              numeric(6,2) CHECK (
    commission_percent IS NULL OR (commission_percent >= 0 AND commission_percent <= 500)
  ),
  moderation_status               text NOT NULL DEFAULT 'submitted'
    CHECK (moderation_status IN ('submitted', 'live', 'needs_changes', 'rejected')),
  admin_note                      text,
  discount_percent                smallint
    CHECK (discount_percent IS NULL OR (discount_percent >= 1 AND discount_percent <= 90)),
  excluded_delivery_destinations  text[] NOT NULL DEFAULT '{}',
  images                          jsonb NOT NULL DEFAULT '[]'::jsonb,
  structured_attributes           jsonb NOT NULL DEFAULT '{}'::jsonb,
  custom_attributes               jsonb NOT NULL DEFAULT '[]'::jsonb,
  admin_overrides                 jsonb,
  admin_change_summary            text,
  admin_last_edited_at            timestamptz,
  admin_last_edited_by            text,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_products_slug_en_key UNIQUE (slug_en)
);

CREATE INDEX IF NOT EXISTS catalog_products_moderation_status_idx ON public.catalog_products (moderation_status);
CREATE INDEX IF NOT EXISTS catalog_products_category_idx ON public.catalog_products (category);

-- Homepage settings
CREATE TABLE IF NOT EXISTS public.catalog_site_settings (
  id                    text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  hero_image            jsonb,
  hero_carousel_images  jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.catalog_site_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- Slug registry
CREATE TABLE IF NOT EXISTS public.catalog_slug_registry (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL,
  locale        text NOT NULL CHECK (locale IN ('en', 'th', 'ru')),
  entity_type   text NOT NULL CHECK (entity_type IN ('bouquet', 'product')),
  entity_id     uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_slug_registry_slug_locale_key UNIQUE (slug, locale)
);

CREATE INDEX IF NOT EXISTS catalog_slug_registry_entity_idx
  ON public.catalog_slug_registry (entity_type, entity_id);

-- Product images (variant galleries)
CREATE TABLE IF NOT EXISTS public.catalog_product_images (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     text NOT NULL CHECK (entity_type IN ('bouquet', 'product')),
  entity_id       uuid NOT NULL,
  revision_id     uuid,
  storage_path    text NOT NULL,
  public_url      text,
  alt_en          text,
  alt_th          text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_primary      boolean NOT NULL DEFAULT false,
  sort_order      integer NOT NULL DEFAULT 0,
  source_type     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      text,
  deleted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS catalog_product_images_entity_idx
  ON public.catalog_product_images (entity_type, entity_id)
  WHERE deleted_at IS NULL AND revision_id IS NULL;
