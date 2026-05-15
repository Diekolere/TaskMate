-- Add bank_code to provider_profiles
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS bank_code TEXT;
