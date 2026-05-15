-- ============================================================
-- Phase 3 Age Verification & DOB
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE provider_profiles 
  ADD COLUMN IF NOT EXISTS dob DATE;

COMMENT ON COLUMN provider_profiles.dob IS 'Provider date of birth for age verification (18+)';
