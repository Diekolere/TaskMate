-- ============================================================
-- Phase 1 Integration Schema Updates
-- Run this in your Supabase SQL Editor to prepare for the Edge Functions
-- ============================================================

-- ── 1. Add new fields to existing tables ──────────────────

ALTER TABLE jobs 
  ADD COLUMN IF NOT EXISTS enhanced_description TEXT,
  ADD COLUMN IF NOT EXISTS ai_suggested_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS matched_providers_count INTEGER DEFAULT 0;

ALTER TABLE provider_profiles 
  ADD COLUMN IF NOT EXISTS squad_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS squad_verified_at TIMESTAMPTZ;

ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

ALTER TABLE earnings 
  ADD COLUMN IF NOT EXISTS squad_payout_ref TEXT,
  ADD COLUMN IF NOT EXISTS payout_initiated_at TIMESTAMPTZ;

-- ── 2. Create New Tables ──────────────────────────────────

-- 2a. payments
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL,
  status          TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  squad_ref       TEXT UNIQUE,
  squad_checkout_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

DROP TRIGGER IF EXISTS set_updated_at_payments ON payments;
CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2b. job_matches
CREATE TABLE IF NOT EXISTS job_matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  provider_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_score     INTEGER NOT NULL, -- 0-100
  ai_rationale    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_job_matches_job_id ON job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_provider_id ON job_matches(provider_id);

ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_matches_select" ON job_matches
  FOR SELECT TO authenticated
  USING (
    provider_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2c. notification_preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_on_interest BOOLEAN DEFAULT TRUE,
  email_on_message BOOLEAN DEFAULT TRUE,
  email_on_match  BOOLEAN DEFAULT TRUE,
  push_on_message BOOLEAN DEFAULT TRUE,
  digest_frequency TEXT DEFAULT 'immediate', -- immediate, daily, weekly, never
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at_notification_preferences ON notification_preferences;
CREATE TRIGGER set_updated_at_notification_preferences
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_preferences_select_own" ON notification_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notification_preferences_update_own" ON notification_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notification_preferences_insert_own" ON notification_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 2d. edge_function_logs
CREATE TABLE IF NOT EXISTS edge_function_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  function_name   TEXT NOT NULL,
  status          TEXT NOT NULL, -- success, error
  error           TEXT,
  duration_ms     INTEGER,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE edge_function_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edge_function_logs_admin_only" ON edge_function_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2e. squad_webhooks
CREATE TABLE IF NOT EXISTS squad_webhooks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  processed       BOOLEAN DEFAULT FALSE,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE squad_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "squad_webhooks_admin_only" ON squad_webhooks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 3. Add to Realtime Publication ────────────────────────

-- We need to check if they are already in the publication to avoid errors, 
-- but doing so via SQL block requires DO. 
-- For simplicity, we just add them (may throw a warning if already added).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'payments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE payments;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'job_matches'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE job_matches;
    END IF;
END $$;
