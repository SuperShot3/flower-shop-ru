-- If 001 was applied with DEFAULT 'Moscow', run this once to align with EKB Flowers launch city.
ALTER TABLE public.catalog_partners
  ALTER COLUMN city SET DEFAULT 'Yekaterinburg';

UPDATE public.catalog_partners
SET city = 'Yekaterinburg'
WHERE city = 'Moscow';
