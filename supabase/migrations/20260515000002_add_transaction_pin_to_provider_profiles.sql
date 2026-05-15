-- Add transaction_pin to provider_profiles
ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS transaction_pin TEXT;

-- Add a comment for clarity
COMMENT ON COLUMN public.provider_profiles.transaction_pin IS '4-digit transaction PIN for withdrawal authorization';
