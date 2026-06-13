-- Idempotent: rename Thai catalog locale columns → Russian (EKB Flowers).
-- Safe on fresh DBs that already use *_ru and on live DBs that still have *_th.

CREATE OR REPLACE FUNCTION public._catalog_rename_col_if_needed(
  p_table text,
  p_old text,
  p_new text
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_old
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_new
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.%I RENAME COLUMN %I TO %I',
      p_table, p_old, p_new
    );
  END IF;
END;
$$;

SELECT public._catalog_rename_col_if_needed('catalog_partners', 'shop_bio_th', 'shop_bio_ru');

SELECT public._catalog_rename_col_if_needed('catalog_bouquets', 'slug_th', 'slug_ru');
SELECT public._catalog_rename_col_if_needed('catalog_bouquets', 'name_th', 'name_ru');
SELECT public._catalog_rename_col_if_needed('catalog_bouquets', 'description_th', 'description_ru');
SELECT public._catalog_rename_col_if_needed('catalog_bouquets', 'composition_th', 'composition_ru');
SELECT public._catalog_rename_col_if_needed('catalog_bouquets', 'seo_title_th', 'seo_title_ru');
SELECT public._catalog_rename_col_if_needed('catalog_bouquets', 'seo_description_th', 'seo_description_ru');

SELECT public._catalog_rename_col_if_needed('catalog_products', 'slug_th', 'slug_ru');
SELECT public._catalog_rename_col_if_needed('catalog_products', 'name_th', 'name_ru');
SELECT public._catalog_rename_col_if_needed('catalog_products', 'description_th', 'description_ru');

SELECT public._catalog_rename_col_if_needed('catalog_product_images', 'alt_th', 'alt_ru');

-- Rename slug indexes when old names still exist
DO $$
BEGIN
  IF to_regclass('public.catalog_bouquets_slug_th_idx') IS NOT NULL
     AND to_regclass('public.catalog_bouquets_slug_ru_idx') IS NULL THEN
    ALTER INDEX public.catalog_bouquets_slug_th_idx RENAME TO catalog_bouquets_slug_ru_idx;
  END IF;
  IF to_regclass('public.catalog_products_slug_th_idx') IS NOT NULL
     AND to_regclass('public.catalog_products_slug_ru_idx') IS NULL THEN
    ALTER INDEX public.catalog_products_slug_th_idx RENAME TO catalog_products_slug_ru_idx;
  END IF;
END $$;

-- Slug registry: Thai locale → Russian
UPDATE public.catalog_slug_registry SET locale = 'ru' WHERE locale = 'th';

ALTER TABLE public.catalog_slug_registry DROP CONSTRAINT IF EXISTS catalog_slug_registry_locale_check;
ALTER TABLE public.catalog_slug_registry
  ADD CONSTRAINT catalog_slug_registry_locale_check
  CHECK (locale IN ('en', 'ru'));

DROP FUNCTION public._catalog_rename_col_if_needed(text, text, text);
