-- Mandatory checkout consent for personal data processing (152-FZ art. 9).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS personal_data_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS personal_data_consent_at timestamptz;

COMMENT ON COLUMN public.orders.personal_data_consent IS
  'Customer gave explicit consent at checkout to process personal data for order fulfilment.';

COMMENT ON COLUMN public.orders.personal_data_consent_at IS
  'Timestamp when personal_data_consent was recorded at order creation.';
